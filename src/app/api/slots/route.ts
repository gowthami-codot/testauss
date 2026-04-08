import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Slot } from '@/models';

// Helper function to generate time slots
function generateTimeSlots(startTime: string, endTime: string, duration: number = 60): string[] {
    const slots: string[] = [];
    const start = new Date(`2000-01-01 ${startTime}`);
    let end = new Date(`2000-01-01 ${endTime}`);

    // If endTime <= startTime, it represents an overnight session wrapping to the next day
    if (end <= start) {
        end = new Date(`2000-01-02 ${endTime}`);
    }

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
        let skippedBecausePast = 0;
        let skippedBecauseOverlap = 0;

        console.log('Processing dates and time slots...');
        for (const date of dates) {
            // Skip if day is in exclude list
            if (excludeDays.includes(date.getDay())) {
                console.log('Skipping excluded day:', date);
                continue;
            }

            // Fetch all existing slots for this doctor on this day AND the next day to handle overnight overlaps
            const existingSlotsForDay = await Slot.find({
                doctorId,
                date: {
                    $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
                    $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 2)
                }
            });

            // Convert existing slots to numerical time ranges for easy overlap checking
            const existingRanges = existingSlotsForDay.map(slot => {
                // If it's a nextDay slot, we add 24h to its start/end time for range comparison
                const isNextDaySlot = slot.date.getTime() > date.getTime();
                const offset = isNextDaySlot ? 24 * 60 * 60 * 1000 : 0;
                
                return {
                    start: new Date(`2000-01-01 ${slot.startTime}`).getTime() + offset,
                    end: new Date(`2000-01-01 ${slot.endTime === '00:00' ? '24:00' : slot.endTime}`).getTime() + offset
                };
            });

            for (const timeSlot of timeSlots) {
                const standardizedTimeSlot = timeSlot.replace(/\u202F/g, ' ');
                const [timeStr, modifier] = standardizedTimeSlot.split(' ');
                let [slotHrs, slotMins] = timeStr.split(':').map(Number);
                if (modifier === 'PM' && slotHrs !== 12) slotHrs += 12;
                if (modifier === 'AM' && slotHrs === 12) slotHrs = 0;

                const [reqStartHr, reqStartMin] = startTime.split(':').map(Number);
                const isNextDay = slotHrs < reqStartHr || (slotHrs === reqStartHr && slotMins < reqStartMin);
                const offsetMs = isNextDay ? 24 * 60 * 60 * 1000 : 0;

                const slotStart = new Date(`2000-01-01 ${standardizedTimeSlot}`);
                const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);
                const slotStartMs = slotStart.getTime() + offsetMs;
                const slotEndMs = slotEnd.getTime() + offsetMs;

                // Check for overlaps
                let hasOverlap = false;
                for (const range of existingRanges) {
                    if (Math.max(slotStartMs, range.start) < Math.min(slotEndMs, range.end)) {
                        hasOverlap = true;
                        break;
                    }
                }

                if (!hasOverlap) {
                    let endTimeString = slotEnd.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    }).replace(/\u202F/g, ' ');
                    
                    // Standardize midnight output
                    if (endTimeString.match(/^12:00 AM/i)) {
                        endTimeString = "12:00 AM";
                    }

                    const actualDate = new Date(date);
                    if (isNextDay) {
                        actualDate.setDate(actualDate.getDate() + 1);
                    }

                    // Check if slot is in the past (Brisbane time)
                    const nowBStr = new Date().toLocaleString('en-US', { timeZone: 'Australia/Brisbane' });
                    const nowB = new Date(nowBStr);

                    // 'date' is created from "YYYY-MM-DD", so UTC methods extract the exact local date components
                    const slotYear = actualDate.getUTCFullYear();
                    const slotMonth = actualDate.getUTCMonth();
                    const slotDay = actualDate.getUTCDate();
                    
                    const slotDateTimeCompare = new Date(slotYear, slotMonth, slotDay, slotHrs, slotMins, 0, 0);
                    
                    if (slotDateTimeCompare < nowB) {
                        console.log('Skipping slot because it has passed in Australia/Brisbane time:', timeSlot, 'on', actualDate);
                        skippedBecausePast++;
                        continue;
                    }

                    slotsToCreate.push({
                        doctorId,
                        doctorName,
                        date: actualDate,
                        startTime: standardizedTimeSlot,
                        endTime: endTimeString,
                        duration,
                        isAvailable: true
                    });
                } else {
                    skippedBecauseOverlap++;
                }
            }
        }

        console.log('Slots to create:', slotsToCreate.length);

        if (slotsToCreate.length === 0) {
            let message = 'No new slots to create (slots may already exist)';
            if (skippedBecausePast > 0 && skippedBecauseOverlap === 0) {
                message = 'Cannot create slots for passed date and time.';
            } else if (skippedBecausePast > 0 && skippedBecauseOverlap > 0) {
                message = 'No new slots created (some times passed, others already exist).';
            }

            return NextResponse.json(
                { message, count: 0 },
                { status: 200 }
            );
        }

        console.log('Inserting slots into database...');
        // Bulk insert slots
        const createdSlots = await Slot.insertMany(slotsToCreate);
        console.log('Slots created successfully:', createdSlots.length);

        return NextResponse.json({
            message: `Successfully created ${createdSlots.length} slots`,
            slots: createdSlots,
            count: createdSlots.length
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
