// Types for API responses
export interface Slot {
    _id: string;
    doctorId: string;
    doctorName: string;
    date: string;
    startTime: string;
    endTime: string;
    duration: number;
    isAvailable: boolean;
}

export interface Appointment {
    _id: string;
    slotId: string;
    doctorId: string;
    doctorName: string;
    patientName: string;
    patientEmail: string;
    patientMobile: string;
    service: string;
    appointmentDate: string;
    appointmentTime: string;
    status: 'confirmed' | 'cancelled' | 'completed';
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface AvailableSlots {
    slotsByDate: { [date: string]: Slot[] };
    availableDates: string[];
    totalSlots: number;
}

export interface PatientHistory {
    hasPreviousBooking: boolean;
    hasInPersonThisYear: boolean;
}

// API service class
class AppointmentAPI {
    private baseURL = '/api';

    // Check patient appointment history by email
    async getPatientHistory(patientEmail: string): Promise<PatientHistory> {
        const searchParams = new URLSearchParams();
        searchParams.set('patientEmail', patientEmail);

        const response = await fetch(`${this.baseURL}/appointments/history?${searchParams}`);

        if (!response.ok) {
            throw new Error('Failed to fetch patient history');
        }

        return response.json();
    }

    // Create Stripe Checkout Session for paid bookings
    async createCheckoutSession(data: {
        slotId: string;
        patientName: string;
        patientEmail: string;
        patientMobile: string;
        service: string;
        amount: number;
        isMedicare: boolean;
        patientType: string;
    }): Promise<{ sessionId: string; url: string }> {
        const response = await fetch(`${this.baseURL}/stripe/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create checkout session');
        }

        return response.json();
    }
    async createSlots(data: {
        doctorId: string;
        doctorName: string;
        startDate: string;
        endDate: string;
        startTime: string;
        endTime: string;
        duration?: number;
        excludeDays?: number[];
    }) {
        const response = await fetch(`${this.baseURL}/slots`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create slots');
        }

        return response.json();
    }

    // Get available slots for calendar display
    async getAvailableSlots(params?: {
        doctorId?: string;
        month?: string; // YYYY-MM format
        date?: string;  // YYYY-MM-DD format
    }): Promise<AvailableSlots> {
        const searchParams = new URLSearchParams();

        if (params?.doctorId) searchParams.set('doctorId', params.doctorId);
        if (params?.month) searchParams.set('month', params.month);
        if (params?.date) searchParams.set('date', params.date);

        const response = await fetch(`${this.baseURL}/slots/available?${searchParams}`);

        if (!response.ok) {
            throw new Error('Failed to fetch available slots');
        }

        return response.json();
    }

    // Get all slots (with filters)
    async getAllSlots(params?: {
        doctorId?: string;
        date?: string;
        startDate?: string;
        endDate?: string;
        isAvailable?: boolean;
    }) {
        const searchParams = new URLSearchParams();

        if (params?.doctorId) searchParams.set('doctorId', params.doctorId);
        if (params?.date) searchParams.set('date', params.date);
        if (params?.startDate) searchParams.set('startDate', params.startDate);
        if (params?.endDate) searchParams.set('endDate', params.endDate);
        if (params?.isAvailable !== undefined) searchParams.set('isAvailable', params.isAvailable.toString());

        const response = await fetch(`${this.baseURL}/slots?${searchParams}`);

        if (!response.ok) {
            throw new Error('Failed to fetch slots');
        }

        return response.json();
    }

    // Book an appointment
    async bookAppointment(data: {
        slotId: string;
        patientName: string;
        patientEmail: string;
        patientMobile: string;
        service: string;
        notes?: string;
        amountPaid?: number;
        isMedicare?: boolean;
        paymentStatus?: 'pending' | 'paid' | 'bulk_billed' | 'failed';
    }) {
        const response = await fetch(`${this.baseURL}/appointments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to book appointment');
        }

        return response.json();
    }

    // Get appointments
    async getAppointments(params?: {
        doctorId?: string;
        patientEmail?: string;
        date?: string;
        status?: string;
    }) {
        const searchParams = new URLSearchParams();

        if (params?.doctorId) searchParams.set('doctorId', params.doctorId);
        if (params?.patientEmail) searchParams.set('patientEmail', params.patientEmail);
        if (params?.date) searchParams.set('date', params.date);
        if (params?.status) searchParams.set('status', params.status);

        const response = await fetch(`${this.baseURL}/appointments?${searchParams}`);

        if (!response.ok) {
            throw new Error('Failed to fetch appointments');
        }

        return response.json();
    }

    // Update appointment status
    async updateAppointment(appointmentId: string, data: {
        status: 'confirmed' | 'cancelled' | 'completed';
        notes?: string;
    }) {
        const response = await fetch(`${this.baseURL}/appointments/${appointmentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update appointment');
        }

        return response.json();
    }

    // Get specific appointment
    async getAppointment(appointmentId: string) {
        const response = await fetch(`${this.baseURL}/appointments/${appointmentId}`);

        if (!response.ok) {
            throw new Error('Failed to fetch appointment');
        }

        return response.json();
    }

    // Cancel appointment (soft delete)
    async cancelAppointment(appointmentId: string, notes?: string) {
        return this.updateAppointment(appointmentId, { status: 'cancelled', notes });
    }

    // Delete appointment (hard delete)
    async deleteAppointment(appointmentId: string) {
        const response = await fetch(`${this.baseURL}/appointments/${appointmentId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete appointment');
        }

        return response.json();
    }
}

// Export singleton instance
export const appointmentAPI = new AppointmentAPI();

// Utility functions for date formatting and manipulation
export const dateUtils = {
    // Format date for API calls (YYYY-MM-DD)
    formatDateForAPI: (date: Date): string => {
        // Use local timezone instead of UTC to avoid date shifts
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    // Format date for display
    formatDateForDisplay: (date: string | Date): string => {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    // Get month string for API (YYYY-MM)
    getMonthString: (date: Date): string => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${year}-${month}`;
    },

    // Check if date is today
    isToday: (date: string | Date): boolean => {
        const d = typeof date === 'string' ? new Date(date) : date;
        const today = new Date();
        return d.toDateString() === today.toDateString();
    },

    // Check if date is in the future
    isFuture: (date: string | Date): boolean => {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d > new Date();
    }
};
