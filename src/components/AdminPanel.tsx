'use client';
  
import React, { useState } from 'react';
import { appointmentAPI, dateUtils } from '@/services/appointmentAPI';
import Swal from 'sweetalert2';

export default function AdminPanel() {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        doctorId: 'scott_01',
        doctorName: 'Scott',
        startDate: '',
        endDate: '',
        sessionType: 'both', // 'morning', 'evening', 'both'
        morningStartTime: '07:00',
        morningEndTime: '08:30',
        eveningStartTime: '17:30',
        eveningEndTime: '19:00',
        duration: 10,
        excludeDays: [] as number[]
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseInt(value) : value
        }));
    };

    const handleDayToggle = (day: number) => {
        setFormData(prev => ({
            ...prev,
            excludeDays: prev.excludeDays.includes(day)
                ? prev.excludeDays.filter(d => d !== day)
                : [...prev.excludeDays, day]
        }));
    };

    const handleCreateSlots = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.startDate || !formData.endDate) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Dates',
                text: 'Please select start and end dates',
                background: '#1f2937',
                color: '#fff',
                confirmButtonColor: '#f59e0b'
            });
            return;
        }

        // Confirmation dialog
        const sessionText = formData.sessionType === 'both'
            ? `Morning: ${formData.morningStartTime} - ${formData.morningEndTime}<br/>Evening: ${formData.eveningStartTime} - ${formData.eveningEndTime}`
            : formData.sessionType === 'morning'
                ? `Morning: ${formData.morningStartTime} - ${formData.morningEndTime}`
                : `Evening: ${formData.eveningStartTime} - ${formData.eveningEndTime}`;

        const result = await Swal.fire({
            icon: 'question',
            title: 'Create Appointment Slots?',
            html: `
                <div style="text-align: center; margin: 20px 0;">
                    <p><strong>Date Range:</strong> ${formData.startDate} to ${formData.endDate}</p>
                    <p><strong>Session(s):</strong></p>
                    <div style="margin-left: 20px;">${sessionText}</div>
                    <p><strong>Duration:</strong> ${formData.duration} minutes per slot</p>
                </div>
            `,
            background: '#1f2937',
            color: '#fff',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, Create Slots',
            cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) return;

        try {
            setIsLoading(true);

            const results = [];

            // Create morning slots if selected
            if (formData.sessionType === 'morning' || formData.sessionType === 'both') {
                const morningResult = await appointmentAPI.createSlots({
                    doctorId: formData.doctorId,
                    doctorName: formData.doctorName,
                    startDate: formData.startDate,
                    endDate: formData.endDate,
                    startTime: formData.morningStartTime,
                    endTime: formData.morningEndTime,
                    duration: formData.duration,
                    excludeDays: formData.excludeDays
                });
                results.push({ type: 'Morning', result: morningResult });
            }

            // Create evening slots if selected
            if (formData.sessionType === 'evening' || formData.sessionType === 'both') {
                const eveningResult = await appointmentAPI.createSlots({
                    doctorId: formData.doctorId,
                    doctorName: formData.doctorName,
                    startDate: formData.startDate,
                    endDate: formData.endDate,
                    startTime: formData.eveningStartTime,
                    endTime: formData.eveningEndTime,
                    duration: formData.duration,
                    excludeDays: formData.excludeDays
                });
                results.push({ type: 'Evening', result: eveningResult });
            }

            const successMessage = results.map(r =>
                `<p><strong>${r.type} Slots:</strong> ${r.result.message}</p>`
            ).join('');

            Swal.fire({
                icon: 'success',
                title: 'Slots Created Successfully!',
                html: `
                    <div style="text-align: center; margin: 20px 0;">
                        ${successMessage}
                    </div>
                `,
                background: '#1f2937',
                color: '#fff',
                confirmButtonColor: '#10b981',
                confirmButtonText: 'Great!',
                timer: 5000,
                timerProgressBar: true,
                showConfirmButton: true
            });

            // Reset form
            setFormData(prev => ({
                ...prev,
                startDate: '',
                endDate: '',
                sessionType: 'both',
                excludeDays: []
            }));

        } catch (error: any) {
            console.error('Error creating slots:', error);
            Swal.fire({
                icon: 'error',
                title: 'Failed to Create Slots',
                text: error.message || 'An error occurred while creating slots. Please try again.',
                background: '#1f2937',
                color: '#fff',
                confirmButtonColor: '#ef4444'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const days = [
        { value: 0, label: 'Sunday' },
        { value: 1, label: 'Monday' },
        { value: 2, label: 'Tuesday' },
        { value: 3, label: 'Wednesday' },
        { value: 4, label: 'Thursday' },
        { value: 5, label: 'Friday' },
        { value: 6, label: 'Saturday' }
    ];

    const generateTodayToNextMonth = () => {
        const today = new Date();
        const nextMonth = new Date(today);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        return {
            today: dateUtils.formatDateForAPI(today),
            nextMonth: dateUtils.formatDateForAPI(nextMonth)
        };
    };

    const quickFill = () => {
        const { today, nextMonth } = generateTodayToNextMonth();
        setFormData(prev => ({
            ...prev,
            startDate: today,
            endDate: nextMonth,
            excludeDays: [0, 6] // Exclude Sunday and Saturday
        }));
    };

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                    Slot Management
                </h1>

                <form onSubmit={handleCreateSlots} className="space-y-6">
                    {/* Doctor Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Scott ID
                            </label>
                            <input
                                type="text"
                                name="doctorId"
                                value={formData.doctorId}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Name
                            </label>
                            <input
                                type="text"
                                name="doctorName"
                                value={formData.doctorName}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Start Date
                            </label>
                            <input
                                type="date"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleInputChange}
                                min={dateUtils.formatDateForAPI(new Date())}
                                className="w-full px-3 py-2 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                End Date
                            </label>
                            <input
                                type="date"
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleInputChange}
                                min={formData.startDate || dateUtils.formatDateForAPI(new Date())}
                                className="w-full px-3 py-2 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                    </div>

                    {/* Session Type Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Select Session Type
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <label className="flex items-center space-x-2 cursor-pointer p-3 border border-gray-300 rounded-md hover:bg-gray-50">
                                <input
                                    type="radio"
                                    name="sessionType"
                                    value="morning"
                                    checked={formData.sessionType === 'morning'}
                                    onChange={handleInputChange}
                                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                                />
                                <span className="text-sm font-medium text-gray-900">Morning Only</span>
                            </label>

                            <label className="flex items-center space-x-2 cursor-pointer p-3 border border-gray-300 rounded-md hover:bg-gray-50">
                                <input
                                    type="radio"
                                    name="sessionType"
                                    value="evening"
                                    checked={formData.sessionType === 'evening'}
                                    onChange={handleInputChange}
                                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                                />
                                <span className="text-sm font-medium text-gray-900">Evening Only</span>
                            </label>

                            <label className="flex items-center space-x-2 cursor-pointer p-3 border border-gray-300 rounded-md hover:bg-gray-50">
                                <input
                                    type="radio"
                                    name="sessionType"
                                    value="both"
                                    checked={formData.sessionType === 'both'}
                                    onChange={handleInputChange}
                                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                                />
                                <span className="text-sm font-medium text-gray-900">Both Sessions</span>
                            </label>
                        </div>
                    </div>

                    {/* Time Range */}
                    <div className="space-y-4">
                        {/* Morning Time Range - show only if morning or both is selected */}
                        {(formData.sessionType === 'morning' || formData.sessionType === 'both') && (
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-3">Morning Session</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Morning Start Time
                                        </label>
                                        <input
                                            type="time"
                                            name="morningStartTime"
                                            value={formData.morningStartTime}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required={formData.sessionType === 'morning' || formData.sessionType === 'both'}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Morning End Time
                                        </label>
                                        <input
                                            type="time"
                                            name="morningEndTime"
                                            value={formData.morningEndTime}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required={formData.sessionType === 'morning' || formData.sessionType === 'both'}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Evening Time Range - show only if evening or both is selected */}
                        {(formData.sessionType === 'evening' || formData.sessionType === 'both') && (
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-3">Evening Session</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Evening Start Time
                                        </label>
                                        <input
                                            type="time"
                                            name="eveningStartTime"
                                            value={formData.eveningStartTime}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required={formData.sessionType === 'evening' || formData.sessionType === 'both'}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Evening End Time
                                        </label>
                                        <input
                                            type="time"
                                            name="eveningEndTime"
                                            value={formData.eveningEndTime}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required={formData.sessionType === 'evening' || formData.sessionType === 'both'}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Slot Duration */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Slot Duration (minutes)
                                </label>
                                <select
                                    name="duration"
                                    value={formData.duration}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value={10}>10 minutes</option>
                                    <option value={15}>15 minutes</option>
                                    <option value={20}>20 minutes</option>
                                    <option value={30}>30 minutes</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Exclude Days */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Exclude Days (Select days to exclude from scheduling)
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {days.map((day) => (
                                <label key={day.value} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.excludeDays.includes(day.value)}
                                        onChange={() => handleDayToggle(day.value)}
                                        className="rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">{day.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Quick Fill Button */}
                    <div className="flex justify-center">
                        <button
                            type="button"
                            onClick={quickFill}
                            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                        >
                            Quick Fill (Today to Next Month, Weekdays Only)
                        </button>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-center pt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`px-8 py-3 rounded-md font-medium transition-colors ${isLoading
                                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                        >
                            {isLoading ? 'Creating Slots...' : 'Create Slots'}
                        </button>
                    </div>
                </form>

                {/* Instructions */}
                <div className="mt-8 p-4 bg-blue-50 rounded-md">
                    <h3 className="text-lg font-medium text-blue-900 mb-2">Instructions:</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Select the date range for which you want to create appointment slots</li>
                        <li>• Choose your session type: Morning Only, Evening Only, or Both Sessions</li>
                        <li>• Set the session times based on your selection:</li>
                        <li className="ml-4">- Morning session: Default 7:00 AM - 8:30 AM</li>
                        <li className="ml-4">- Evening session: Default 5:30 PM - 7:00 PM</li>
                        <li>• Each slot is 10 minutes long by default (customizable)</li>
                        <li>• Exclude days you don't want to work (e.g., weekends)</li>
                        <li>• Click "Create Slots" to generate time slots for your selected session(s)</li>
                        <li>• Use "Quick Fill" to set up weekdays only for the next month</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
