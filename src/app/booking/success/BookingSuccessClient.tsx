'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Bebas_Neue, Manrope } from 'next/font/google';
import Link from 'next/link';

const bebasNeue = Bebas_Neue({ weight: '400', subsets: ['latin'] });
const manrope = Manrope({ weight: '400', subsets: ['latin'] });

interface BookingDetails {
    service: string;
    patientName: string;
    appointmentDate: string;
    appointmentTime: string;
    amountPaid: number;
    meetLink?: string;
    receiptUrl?: string;
}

export default function BookingSuccessClient() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [booking, setBooking] = useState<BookingDetails | null>(null);

    useEffect(() => {
        if (!sessionId) {
            setStatus('error');
            return;
        }

        const checkPayment = async () => {
            try {
                const res = await fetch(`/api/stripe/verify?session_id=${sessionId}`);
                if (res.ok) {
                    const data = await res.json();
                    setBooking(data.booking);
                    setStatus('success');
                } else {
                    setStatus('error');
                }
            } catch {
                setStatus('error');
            }
        };

        checkPayment();
    }, [sessionId]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a1628] to-[#1a2d4a] flex items-center justify-center p-4">
            <div className={`max-w-md w-full text-center ${manrope.className}`}>
                {status === 'loading' && (
                    <div className="space-y-4">
                        <div className="animate-spin h-12 w-12 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto"></div>
                        <p className="text-white/70 text-lg">Confirming your payment...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-8 space-y-6">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        <div>
                            <h1 className={`text-4xl font-bold text-white mb-2 ${bebasNeue.className}`}>
                                BOOKING <span className="text-cyan-400">CONFIRMED</span>
                            </h1>
                            <p className="text-white/60 text-sm">Your appointment has been successfully booked.</p>
                        </div>

                        {booking && (
                            <div className="bg-white/5 rounded-lg border border-white/10 divide-y divide-white/10 text-left">
                                <div className="flex justify-between px-4 py-3">
                                    <span className="text-white/50 text-sm">Service</span>
                                    <span className="text-white text-sm font-medium text-right max-w-[60%]">{booking.service}</span>
                                </div>
                                <div className="flex justify-between px-4 py-3">
                                    <span className="text-white/50 text-sm">Amount Paid</span>
                                    <span className="text-cyan-400 text-sm font-medium">${booking.amountPaid?.toFixed(2)}</span>
                                </div>
                            </div>
                        )}

                        <p className="text-white/50 text-xs">
                            A confirmation email has been sent to your email address.
                        </p>

                        <div className="flex flex-col gap-3 pt-2">
                            {booking?.receiptUrl && (
                                <a
                                    href={booking.receiptUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex justify-center items-center gap-2 px-8 py-3 bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 transition-all"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Download Invoice Receipt
                                </a>
                            )}
                            <Link
                                href="/"
                                className="inline-block px-8 py-3 bg-gradient-to-br from-[#0583F4] to-[#09B9AC] text-white font-semibold hover:opacity-90 transition-opacity"
                            >
                                Back to Home
                            </Link>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-8 space-y-6">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>

                        <div>
                            <h1 className={`text-4xl font-bold text-white mb-2 ${bebasNeue.className}`}>
                                PAYMENT <span className="text-red-400">ISSUE</span>
                            </h1>
                            <p className="text-white/60 text-sm">
                                We couldn&apos;t confirm your payment. Please try booking again or contact support.
                            </p>
                        </div>

                        <Link
                            href="/"
                            className="inline-block px-8 py-3 bg-gradient-to-br from-[#0583F4] to-[#09B9AC] text-white font-semibold hover:opacity-90 transition-opacity"
                        >
                            Back to Home
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
