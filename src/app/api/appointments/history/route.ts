import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Appointment } from '@/models';

// GET - Check patient appointment history
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const patientEmail = searchParams.get('patientEmail');

        if (!patientEmail) {
            return NextResponse.json(
                { error: 'patientEmail query parameter is required' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(patientEmail)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Check if patient has ANY previous booking with Scott (non-cancelled)
        const anyPreviousBooking = await Appointment.findOne({
            patientEmail,
            status: { $ne: 'cancelled' }
        }).lean();

        const hasPreviousBooking = !!anyPreviousBooking;

        // Check if patient has an in-person appointment within the current calendar year
        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(currentYear, 0, 1); // Jan 1
        const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999); // Dec 31

        const inPersonThisYear = await Appointment.findOne({
            patientEmail,
            status: { $ne: 'cancelled' },
            appointmentDate: {
                $gte: startOfYear,
                $lte: endOfYear
            },
            service: { $regex: /^In Person/i }
        }).lean();

        const hasInPersonThisYear = !!inPersonThisYear;

        return NextResponse.json({
            hasPreviousBooking,
            hasInPersonThisYear
        });

    } catch (error) {
        console.error('Error checking patient history:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
