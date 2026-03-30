import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Appointment, Slot } from '@/models';
import mongoose from 'mongoose';

// PUT - Update appointment status (cancel, reschedule, etc.)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const { id: appointmentId } = await params;
        const body = await request.json();
        const { status, notes } = body;

        if (!appointmentId) {
            return NextResponse.json(
                { error: 'Appointment ID is required' },
                { status: 400 }
            );
        }

        if (!status) {
            return NextResponse.json(
                { error: 'Status is required' },
                { status: 400 }
            );
        }

        if (!['confirmed', 'cancelled', 'completed'].includes(status)) {
            return NextResponse.json(
                { error: 'Invalid status. Must be confirmed, cancelled, or completed' },
                { status: 400 }
            );
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Find the appointment
            const appointment = await Appointment.findById(appointmentId).session(session);

            if (!appointment) {
                await session.abortTransaction();
                return NextResponse.json(
                    { error: 'Appointment not found' },
                    { status: 404 }
                );
            }

            const oldStatus = appointment.status;

            // Update appointment
            appointment.status = status;
            if (notes) appointment.notes = notes;
            appointment.updatedAt = new Date();

            await appointment.save({ session });

            // If cancelling appointment, make the slot available again
            if (status === 'cancelled' && oldStatus !== 'cancelled') {
                await Slot.findByIdAndUpdate(
                    appointment.slotId,
                    {
                        isAvailable: true,
                        updatedAt: new Date()
                    },
                    { session }
                );
            }

            // If rebooking a cancelled appointment, make the slot unavailable
            if (status === 'confirmed' && oldStatus === 'cancelled') {
                await Slot.findByIdAndUpdate(
                    appointment.slotId,
                    {
                        isAvailable: false,
                        updatedAt: new Date()
                    },
                    { session }
                );
            }

            await session.commitTransaction();

            return NextResponse.json({
                message: 'Appointment updated successfully',
                appointment: {
                    _id: appointment._id,
                    status: appointment.status,
                    updatedAt: appointment.updatedAt
                }
            });

        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }

    } catch (error) {
        console.error('Error updating appointment:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET - Get specific appointment details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const { id: appointmentId } = await params;

        if (!appointmentId) {
            return NextResponse.json(
                { error: 'Appointment ID is required' },
                { status: 400 }
            );
        }

        const appointment = await Appointment.findById(appointmentId).lean();

        if (!appointment) {
            return NextResponse.json(
                { error: 'Appointment not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ appointment });

    } catch (error) {
        console.error('Error fetching appointment:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE - Delete appointment (hard delete)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const { id: appointmentId } = await params;

        if (!appointmentId) {
            return NextResponse.json(
                { error: 'Appointment ID is required' },
                { status: 400 }
            );
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Find the appointment
            const appointment = await Appointment.findById(appointmentId).session(session);

            if (!appointment) {
                await session.abortTransaction();
                return NextResponse.json(
                    { error: 'Appointment not found' },
                    { status: 404 }
                );
            }

            // Make the slot available again if appointment was confirmed
            if (appointment.status === 'confirmed') {
                await Slot.findByIdAndUpdate(
                    appointment.slotId,
                    {
                        isAvailable: true,
                        updatedAt: new Date()
                    },
                    { session }
                );
            }

            // Delete the appointment
            await Appointment.findByIdAndDelete(appointmentId, { session });

            await session.commitTransaction();

            return NextResponse.json({
                message: 'Appointment deleted successfully'
            });

        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }

    } catch (error) {
        console.error('Error deleting appointment:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
