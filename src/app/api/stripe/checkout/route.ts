import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';

// POST - Create a Stripe Checkout Session
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            slotId,
            patientName,
            patientEmail,
            patientMobile,
            service,
            amount, // in dollars (32 or 64)
            isMedicare,
            patientType, // 'New' or 'Returning'
        } = body;

        // Validate required fields
        if (!slotId || !patientEmail || !service || !amount) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            customer_email: patientEmail,
            line_items: [
                {
                    price_data: {
                        currency: 'aud',
                        product_data: {
                            name: service,
                            description: `Consultation with Dr. Scott — ${patientType} Patient`,
                        },
                        unit_amount: amount * 100, // Stripe uses cents
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                slotId,
                patientName,
                patientEmail,
                patientMobile,
                service,
                amount: amount.toString(),
                isMedicare: isMedicare.toString(),
                patientType,
            },
            success_url: `${baseUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/?booking_cancelled=true`,
        });

        return NextResponse.json({
            sessionId: session.id,
            url: session.url,
        });
    } catch (error: any) {
        console.error('Error creating Stripe session:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create payment session' },
            { status: 500 }
        );
    }
}
