import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Slot } from '@/models';

// Helper function to generate time slots
function generateTimeSlots(startTime: string, endTime: string, duration: number = 60): string[] {
    const slots: string[] = [];
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);

    let current = new Date(start);

    // Generate slots while there's enough time for a complete slot
    while (current.getTime() + (duration * 60 * 1000) <= end.getTime()) {
        const timeString = current.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        slots.push(timeString);

        // Move to next slot using getTime() for precision
        current = new Date(current.getTime() + duration * 60 * 1000);
    }

    return slots;
}

// Helper function to parse date range
function getDateRange(startDate: string, endDate: string): Date[] {
    const dates: Date[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d));
    }

    return dates;
}

// POST - Create slots for a doctor
export async function POST(request: NextRequest) {
    try {
        console.log('Starting slot creation...');
        await connectDB();
        console.log('Database connected successfully');

        const body = await request.json();
        console.log('Request body received:', body);

        const {
            doctorId,
            doctorName,
            startDate,
            endDate,
            startTime,
            endTime,
            duration = 60,
            excludeDays = [] // Array of days to exclude (0 = Sunday, 1 = Monday, etc.)
        } = body;

        // Validate required fields
        if (!doctorId || !doctorName || !startDate || !endDate || !startTime || !endTime) {
            console.log('Missing required fields:', { doctorId, doctorName, startDate, endDate, startTime, endTime });
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        console.log('Generating date range...');
        // Generate date range
        const dates = getDateRange(startDate, endDate);
        console.log('Date range generated:', dates.length, 'dates');

        console.log('Generating time slots...');
        // Generate time slots for each day
        const timeSlots = generateTimeSlots(startTime, endTime, duration);
        console.log('Time slots generated:', timeSlots);

        const slotsToCreate = [];

        console.log('Processing dates and time slots...');
        for (const date of dates) {
            // Skip if day is in exclude list
            if (excludeDays.includes(date.getDay())) {
                console.log('Skipping excluded day:', date);
                continue;
            }

            for (const timeSlot of timeSlots) {
                // Check if slot already exists
                const existingSlot = await Slot.findOne({
                    doctorId,
                    date: {
                        $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
                        $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
                    },
                    startTime: timeSlot
                });

                if (!existingSlot) {
                    // Calculate the end time for this slot
                    const slotStart = new Date(`2000-01-01 ${timeSlot}`);
                    const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);
                    const endTimeString = slotEnd.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    });

                    slotsToCreate.push({
                        doctorId,
                        doctorName,
                        date,
                        startTime: timeSlot,
                        endTime: endTimeString,
                        duration,
                        isAvailable: true
                    });
                }
            }
        }

        console.log('Slots to create:', slotsToCreate.length);

        if (slotsToCreate.length === 0) {
            return NextResponse.json(
                { message: 'No new slots to create (slots may already exist)' },
                { status: 200 }
            );
        }

        console.log('Inserting slots into database...');
        // Bulk insert slots
        const createdSlots = await Slot.insertMany(slotsToCreate);
        console.log('Slots created successfully:', createdSlots.length);

        return NextResponse.json({
            message: `Successfully created ${createdSlots.length} slots`,
            slots: createdSlots
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating slots:', error);
        console.error('Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : 'No stack trace'
        });
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// GET - Get all slots (with filters)
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const doctorId = searchParams.get('doctorId');
        const date = searchParams.get('date');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const isAvailable = searchParams.get('isAvailable');

        // Build query
        const query: any = {};

        if (doctorId) {
            query.doctorId = doctorId;
        }

        if (date) {
            const queryDate = new Date(date);
            query.date = {
                $gte: new Date(queryDate.getFullYear(), queryDate.getMonth(), queryDate.getDate()),
                $lt: new Date(queryDate.getFullYear(), queryDate.getMonth(), queryDate.getDate() + 1)
            };
        } else if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        if (isAvailable === 'true') {
            query.isAvailable = true;
        }

        const slots = await Slot.find(query)
            .sort({ date: 1, startTime: 1 })
            .lean();

        return NextResponse.json({
            slots,
            count: slots.length
        });

    } catch (error) {
        console.error('Error fetching slots:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
