import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Slot } from '@/models';

// GET - Get available slots (optimized for frontend calendar)
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const doctorId = searchParams.get('doctorId');
        const month = searchParams.get('month'); // Format: YYYY-MM
        const date = searchParams.get('date'); // Format: YYYY-MM-DD

        // Build query for available slots only
        const query: any = {
            isAvailable: true,
            date: { $gte: new Date() } // Only future slots
        };

        if (doctorId) {
            query.doctorId = doctorId;
        }

        if (date) {
            // Get slots for specific date
            const queryDate = new Date(date);
            query.date = {
                $gte: new Date(queryDate.getFullYear(), queryDate.getMonth(), queryDate.getDate()),
                $lt: new Date(queryDate.getFullYear(), queryDate.getMonth(), queryDate.getDate() + 1)
            };
        } else if (month) {
            // Get slots for specific month
            const [year, monthNum] = month.split('-').map(Number);
            query.date = {
                $gte: new Date(year, monthNum - 1, 1),
                $lt: new Date(year, monthNum, 1)
            };
        } else {
            // Default: get slots for next 30 days
            const today = new Date();
            const thirtyDaysLater = new Date();
            thirtyDaysLater.setDate(today.getDate() + 30);

            query.date = {
                $gte: today,
                $lte: thirtyDaysLater
            };
        }

        const slots = await Slot.find(query)
            .sort({ date: 1, startTime: 1 })
            .lean();

        // Group slots by date for easier frontend consumption
        const slotsByDate: { [key: string]: any[] } = {};

        slots.forEach(slot => {
            const dateKey = slot.date.toISOString().split('T')[0];
            if (!slotsByDate[dateKey]) {
                slotsByDate[dateKey] = [];
            }
            slotsByDate[dateKey].push({
                _id: slot._id,
                doctorId: slot.doctorId,
                doctorName: slot.doctorName,
                startTime: slot.startTime,
                endTime: slot.endTime,
                duration: slot.duration
            });
        });

        // Also provide an array of available dates for calendar highlighting
        const availableDates = Object.keys(slotsByDate);

        return NextResponse.json({
            slotsByDate,
            availableDates,
            totalSlots: slots.length
        });

    } catch (error) {
        console.error('Error fetching available slots:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
