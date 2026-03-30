import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Appointment, Slot } from '@/models';
import mongoose from 'mongoose';

// POST - Book an appointment
export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const body = await request.json();
        const {
            slotId,
            patientName,
            patientEmail,
            patientMobile,
            service,
            notes,
            amountPaid,
            isMedicare,
            paymentStatus,
        } = body;

        // Validate required fields
        if (!slotId || !patientName || !patientEmail || !patientMobile || !service) {
            return NextResponse.json(
                { error: 'Missing required fields' },
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

        // Start a transaction
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Find and check if slot is available
            const slot = await Slot.findById(slotId).session(session);

            if (!slot) {
                await session.abortTransaction();
                return NextResponse.json(
                    { error: 'Slot not found' },
                    { status: 404 }
                );
            }

            if (!slot.isAvailable) {
                await session.abortTransaction();
                return NextResponse.json(
                    { error: 'Slot is no longer available' },
                    { status: 409 }
                );
            }

            // Check if slot is in the past
            const now = new Date();
            const slotDateTime = new Date(slot.date);
            const [time, period] = slot.startTime.split(' ');
            const [hours, minutes] = time.split(':').map(Number);
            let adjustedHours = hours;

            if (period === 'PM' && hours !== 12) {
                adjustedHours += 12;
            } else if (period === 'AM' && hours === 12) {
                adjustedHours = 0;
            }

            slotDateTime.setHours(adjustedHours, minutes, 0, 0);

            if (slotDateTime <= now) {
                await session.abortTransaction();
                return NextResponse.json(
                    { error: 'Cannot book appointments for past dates/times' },
                    { status: 400 }
                );
            }

            // Check if patient already has an appointment at this time
            const existingAppointment = await Appointment.findOne({
                patientEmail,
                appointmentDate: slot.date,
                appointmentTime: slot.startTime,
                status: { $ne: 'cancelled' }
            }).session(session);

            if (existingAppointment) {
                await session.abortTransaction();
                return NextResponse.json(
                    { error: 'You already have an appointment at this time' },
                    { status: 409 }
                );
            }

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
                notes,
                amountPaid: amountPaid || 0,
                paymentStatus: paymentStatus || 'bulk_billed',
                isMedicare: isMedicare || false,
                meetLink,
            });

            await appointment.save({ session });

            // Mark slot as unavailable
            await Slot.findByIdAndUpdate(
                slotId,
                {
                    isAvailable: false,
                    updatedAt: new Date()
                },
                { session }
            );

            await session.commitTransaction();

            // Send appointment confirmation email
            try {
                const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/email`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        patientName,
                        patientEmail,
                        patientMobile,
                        service,
                        doctorName: appointment.doctorName,
                        appointmentDate: appointment.appointmentDate,
                        appointmentTime: appointment.appointmentTime,
                        meetLink,
                        notes,
                        appointmentId: appointment._id.toString(),
                        type: 'booking_request'
                    }),
                });

                if (!emailResponse.ok) {
                    console.error('Failed to send appointment confirmation email:', await emailResponse.text());
                } else {
                    console.log('Appointment confirmation email sent successfully');
                }
            } catch (emailError) {
                console.error('Error sending appointment confirmation email:', emailError);
                // Don't fail the appointment booking if email fails
            }

            return NextResponse.json({
                message: 'Appointment booked successfully',
                appointment: {
                    _id: appointment._id,
                    doctorName: appointment.doctorName,
                    appointmentDate: appointment.appointmentDate,
                    appointmentTime: appointment.appointmentTime,
                    service: appointment.service,
                    status: appointment.status,
                    meetLink: appointment.meetLink,
                    amountPaid: appointment.amountPaid,
                    paymentStatus: appointment.paymentStatus,
                }
            }, { status: 201 });

        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }

    } catch (error) {
        console.error('Error booking appointment:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET - Get appointments
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const doctorId = searchParams.get('doctorId');
        const patientEmail = searchParams.get('patientEmail');
        const date = searchParams.get('date');
        const status = searchParams.get('status');

        // Build query
        const query: any = {};

        if (doctorId) {
            query.doctorId = doctorId;
        }

        if (patientEmail) {
            query.patientEmail = patientEmail;
        }

        if (date) {
            const queryDate = new Date(date);
            query.appointmentDate = {
                $gte: new Date(queryDate.getFullYear(), queryDate.getMonth(), queryDate.getDate()),
                $lt: new Date(queryDate.getFullYear(), queryDate.getMonth(), queryDate.getDate() + 1)
            };
        }

        if (status) {
            query.status = status;
        }

        const appointments = await Appointment.find(query)
            .sort({ appointmentDate: 1, appointmentTime: 1 })
            .lean();

        return NextResponse.json({
            appointments,
            count: appointments.length
        });

    } catch (error) {
        console.error('Error fetching appointments:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
