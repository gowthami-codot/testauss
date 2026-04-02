import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Appointment, Slot } from '@/models';
import stripe from '@/lib/stripe';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

function getBaseUrl() {
    return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
}

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const action = searchParams.get('action');

        if (!id || !action || !['confirm', 'reject'].includes(action)) {
            return new NextResponse('Invalid request', { status: 400 });
        }

        const appointment = await Appointment.findById(id);

        if (!appointment) {
            return new NextResponse('Appointment not found', { status: 404 });
        }

        // Check expiration (48 hours)
        const now = new Date();
        const createdAt = new Date(appointment.createdAt);
        const diffHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

        if (diffHours > 48) {
            return new NextResponse(`
                <html>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h1 style="color: #dc2626;">This booking request has expired</h1>
                    <p>It has been more than 48 hours since the request was made.</p>
                </body>
                </html>
            `, { headers: { 'Content-Type': 'text/html' } });
        }

        if (appointment.status === 'confirmed') {
            return new NextResponse(`
                <html>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h1 style="color: #16a34a;">Success</h1>
                    <p>Booking already confirmed.</p>
                </body>
                </html>
            `, { headers: { 'Content-Type': 'text/html' } });
        } else if (appointment.status === 'rejected') {
            return new NextResponse(`
                <html>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h1 style="color: #dc2626;">Already Rejected</h1>
                    <p>Booking already rejected.</p>
                </body>
                </html>
            `, { headers: { 'Content-Type': 'text/html' } });
        } else if (appointment.status !== 'pending_confirmation') {
            return new NextResponse(`
                <html>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h1 style="color: #ca8a04;">Invalid Status</h1>
                    <p>Booking status is ${appointment.status}.</p>
                </body>
                </html>
            `, { headers: { 'Content-Type': 'text/html' } });
        }

        if (action === 'confirm') {
            const force = searchParams.get('force');
            if (force !== 'true') {
                const conflictingAppointment = await Appointment.findOne({
                    slotId: appointment.slotId,
                    status: 'confirmed',
                    _id: { $ne: appointment._id }
                });

                if (conflictingAppointment) {
                    return new NextResponse(`
                        <html>
                        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #fffbeb;">
                            <h1 style="color: #d97706;">Conflict Detected</h1>
                            <p>You have a session with another patient - <strong>${conflictingAppointment.patientName}</strong> in this time slot.</p>
                            <p>Do you still want to confirm?</p>
                            <div style="margin-top: 30px;">
                                <a href="${getBaseUrl()}/api/appointments/action?id=${id}&action=confirm&force=true" style="display: inline-block; background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 15px;">Confirm</a>
                                <a href="${getBaseUrl()}/api/appointments/action?id=${id}&action=reject" style="display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reject</a>
                            </div>
                        </body>
                        </html>
                    `, { headers: { 'Content-Type': 'text/html' } });
                }
            }

            appointment.status = 'confirmed';
            await appointment.save();

            // Send confirmation email to patient
            try {
                await fetch(`${getBaseUrl()}/api/email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        patientName: appointment.patientName,
                        patientEmail: appointment.patientEmail,
                        patientMobile: appointment.patientMobile,
                        service: appointment.service,
                        doctorName: appointment.doctorName,
                        appointmentDate: appointment.appointmentDate,
                        appointmentTime: appointment.appointmentTime,
                        meetLink: appointment.meetLink,
                        notes: appointment.notes,
                        type: 'confirmed'
                    }),
                });
            } catch (err) {
                console.error('Failed to send confirmed email to patient:', err);
            }

            return new NextResponse(`
                <html>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f0fdf4;">
                    <h1 style="color: #16a34a;">Booking Confirmed!</h1>
                    <p>The appointment has been confirmed and the patient has been notified.</p>
                </body>
                </html>
            `, { headers: { 'Content-Type': 'text/html' } });

        } else if (action === 'reject') {
            appointment.status = 'rejected';

            let refundNote = 'No refund required (Bulk Billed).';

            // Process refund if paid
            if (appointment.paymentStatus === 'paid' && appointment.amountPaid > 0 && appointment.stripeSessionId) {
                try {
                    // Try to retrieve the charge from the session
                    const session = await stripe.checkout.sessions.retrieve(appointment.stripeSessionId);
                    if (session.payment_intent) {
                        await stripe.refunds.create({
                            payment_intent: session.payment_intent as string,
                            amount: appointment.amountPaid * 100 // Stripe expects cents
                        });
                        refundNote = `A Stripe refund of $${appointment.amountPaid} has been initiated.`;
                        appointment.paymentStatus = 'refunded';
                    } else {
                        console.error('No payment intent attached to session');
                    }
                } catch (err) {
                    console.error('Stripe refund failed:', err);
                    refundNote = `Note: Stripe refund failed. Please adjust manually via dashboard.`;
                }
            }

            // Free the slot
            await Slot.findByIdAndUpdate(appointment.slotId, { isAvailable: true });

            await appointment.save();

            // Send rejection email to patient
            try {
                await fetch(`${getBaseUrl()}/api/email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        patientName: appointment.patientName,
                        patientEmail: appointment.patientEmail,
                        patientMobile: appointment.patientMobile,
                        service: appointment.service,
                        doctorName: appointment.doctorName,
                        appointmentDate: appointment.appointmentDate,
                        appointmentTime: appointment.appointmentTime,
                        type: 'rejected',
                        refundNote
                    }),
                });
            } catch (err) {
                console.error('Failed to send rejected email to patient:', err);
            }

            return new NextResponse(`
                <html>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #fef2f2;">
                    <h1 style="color: #dc2626;">Booking Rejected</h1>
                    <p>The appointment has been rejected and the patient has been notified.</p>
                    <p>${refundNote}</p>
                </body>
                </html>
            `, { headers: { 'Content-Type': 'text/html' } });
        }

    } catch (error) {
        console.error('Error handling appointment action:', error);
        return new NextResponse('Internal server error', { status: 500 });
    }
}
