import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import connectDB from '@/lib/mongodb';
import { Appointment, Slot } from '@/models';
import mongoose from 'mongoose';

// Disable Next.js body parsing — Stripe needs the raw body
export const dynamic = 'force-dynamic';

// POST - Handle Stripe webhook events
export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const signature = request.headers.get('stripe-signature');

        if (!signature) {
            return NextResponse.json(
                { error: 'Missing stripe-signature header' },
                { status: 400 }
            );
        }

        let event;

        // If webhook secret is configured, verify the signature
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (webhookSecret && webhookSecret !== 'whsec_placeholder') {
            try {
                event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
            } catch (err: any) {
                console.error('Webhook signature verification failed:', err.message);
                return NextResponse.json(
                    { error: 'Webhook signature verification failed' },
                    { status: 400 }
                );
            }
        } else {
            // For local testing without webhook secret, parse event directly
            event = JSON.parse(body);
        }

        // Handle the event
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;

            // Extract metadata
            const {
                slotId,
                patientName,
                patientEmail,
                patientMobile,
                service,
                amount,
                isMedicare,
                patientType,
            } = session.metadata || {};

            if (!slotId || !patientEmail) {
                console.error('Webhook: Missing metadata in session');
                return NextResponse.json({ received: true });
            }

            await connectDB();

            // Start a transaction
            const dbSession = await mongoose.startSession();
            dbSession.startTransaction();

            try {
                // Find the slot
                const slot = await Slot.findById(slotId).session(dbSession);

                if (!slot) {
                    console.error('Webhook: Slot not found:', slotId);
                    await dbSession.abortTransaction();
                    return NextResponse.json({ received: true });
                }

                // We no longer abort if slot is unavailable because the payment has already been processed by Stripe.
                // We will create the appointment and let the doctor arbitrate conflicts.

                // Generate meet link for video consultations
                let meetLink: string | undefined;
                const appointmentId = new mongoose.Types.ObjectId();
                if (service === 'Video Consultation') {
                    const roomName = `aussiemale-${appointmentId.toString()}`;
                    meetLink = `https://meet.jit.si/${roomName}`;
                }

                // Create the appointment
                const appointment = new Appointment({
                    _id: appointmentId,
                    slotId: slot._id,
                    doctorId: slot.doctorId,
                    doctorName: slot.doctorName,
                    patientName,
                    patientEmail,
                    patientMobile,
                    service,
                    appointmentDate: slot.date,
                    appointmentTime: slot.startTime,
                    status: 'pending_confirmation',
                    amountPaid: parseFloat(amount) || 0,
                    paymentStatus: 'paid',
                    stripeSessionId: session.id,
                    isMedicare: isMedicare === 'true',
                    meetLink,
                });

                await appointment.save({ session: dbSession });

                // Mark slot as unavailable
                await Slot.findByIdAndUpdate(
                    slotId,
                    { isAvailable: false, updatedAt: new Date() },
                    { session: dbSession }
                );

                await dbSession.commitTransaction();

                // Send confirmation email (non-blocking)
                try {
                    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
                    await fetch(`${baseUrl}/api/email`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            patientName,
                            patientEmail,
                            patientMobile,
                            service,
                            doctorName: slot.doctorName,
                            appointmentDate: slot.date,
                            appointmentTime: slot.startTime,
                            meetLink,
                            appointmentId: appointment._id.toString(),
                            type: 'booking_request'
                        }),
                    });
                } catch (emailError) {
                    console.error('Webhook: Error sending email:', emailError);
                }

                console.log('Webhook: Appointment created successfully:', appointmentId.toString());
            } catch (error) {
                await dbSession.abortTransaction();
                console.error('Webhook: Error creating appointment:', error);
            } finally {
                dbSession.endSession();
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook handler error:', error);
        return NextResponse.json(
            { error: 'Webhook handler failed' },
            { status: 500 }
        );
    }
}
