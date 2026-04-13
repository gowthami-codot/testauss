import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import connectDB from '@/lib/mongodb';
import { Appointment } from '@/models';

// GET - Verify Stripe session and return booking details
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('session_id');

        if (!sessionId) {
            return NextResponse.json(
                { error: 'session_id is required' },
                { status: 400 }
            );
        }

        // Retrieve the Stripe session with expanded payment intent to get receipt URL
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['payment_intent.latest_charge']
        });

        if (session.payment_status !== 'paid') {
            return NextResponse.json(
                { error: 'Payment not completed' },
                { status: 400 }
            );
        }

        const paymentIntent = session.payment_intent as any;
        const receiptUrl = paymentIntent?.latest_charge?.receipt_url || null;

        // Look up the appointment by stripeSessionId
        await connectDB();
        const appointment = await Appointment.findOne({
            stripeSessionId: sessionId,
        }).lean() as any;

        if (!appointment) {
            // Webhook may not have processed yet — return basic info from session metadata
            return NextResponse.json({
                booking: {
                    service: session.metadata?.service || 'Consultation',
                    patientName: session.metadata?.patientName || '',
                    amountPaid: parseFloat(session.metadata?.amount || '0'),
                    meetLink: null,
                    appointmentDate: null,
                    appointmentTime: null,
                    receiptUrl,
                },
            });
        }

        return NextResponse.json({
            booking: {
                service: appointment.service,
                patientName: appointment.patientName,
                appointmentDate: appointment.appointmentDate,
                appointmentTime: appointment.appointmentTime,
                amountPaid: appointment.amountPaid,
                meetLink: appointment.meetLink || null,
                receiptUrl,
            },
        });
    } catch (error: any) {
        console.error('Error verifying payment:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to verify payment' },
            { status: 500 }
        );
    }
}
