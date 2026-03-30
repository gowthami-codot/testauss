import mongoose, { Schema, Document } from 'mongoose';

// Doctor Slot Schema
export interface ISlot extends Document {
    doctorId: string;
    doctorName: string;
    date: Date;
    startTime: string;
    endTime: string;
    duration: number; // in minutes
    isAvailable: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const SlotSchema = new Schema<ISlot>({
    doctorId: { type: String, required: true },
    doctorName: { type: String, required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    duration: { type: Number, default: 60 },
    isAvailable: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Compound index for efficient querying
SlotSchema.index({ doctorId: 1, date: 1, startTime: 1 });

// Appointment Schema
export interface IAppointment extends Document {
    slotId: mongoose.Types.ObjectId;
    doctorId: string;
    doctorName: string;
    patientName: string;
    patientEmail: string;
    patientMobile: string;
    service: string;
    appointmentDate: Date;
    appointmentTime: string;
    status: 'pending_confirmation' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';
    notes?: string;
    amountPaid: number;
    paymentStatus: 'pending' | 'paid' | 'bulk_billed' | 'failed' | 'refunded';
    stripeSessionId?: string;
    isMedicare: boolean;
    meetLink?: string;
    createdAt: Date;
    updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>({
    slotId: { type: Schema.Types.ObjectId, ref: 'Slot', required: true },
    doctorId: { type: String, required: true },
    doctorName: { type: String, required: true },
    patientName: { type: String, required: true },
    patientEmail: { type: String, required: true },
    patientMobile: { type: String, required: true },
    service: { type: String, required: true },
    appointmentDate: { type: Date, required: true },
    appointmentTime: { type: String, required: true },
    status: {
        type: String,
        enum: ['pending_confirmation', 'confirmed', 'rejected', 'cancelled', 'completed'],
        default: 'pending_confirmation'
    },
    notes: { type: String },
    amountPaid: { type: Number, default: 0 },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'bulk_billed', 'failed', 'refunded'],
        default: 'pending'
    },
    stripeSessionId: { type: String },
    isMedicare: { type: Boolean, default: false },
    meetLink: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Indexes for efficient querying
AppointmentSchema.index({ doctorId: 1, appointmentDate: 1 });
AppointmentSchema.index({ patientEmail: 1 });
AppointmentSchema.index({ slotId: 1 });

export const Slot = mongoose.models.Slot || mongoose.model<ISlot>('Slot', SlotSchema);
export const Appointment = mongoose.models.Appointment || mongoose.model<IAppointment>('Appointment', AppointmentSchema);
