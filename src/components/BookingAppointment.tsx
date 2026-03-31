'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bebas_Neue, Manrope } from 'next/font/google';
import { X } from 'lucide-react';
import { appointmentAPI, dateUtils, type AvailableSlots, type PatientHistory } from '@/services/appointmentAPI';
import Swal from 'sweetalert2';

const bebasNeue = Bebas_Neue({ weight: '400', subsets: ['latin'] });
const manrope = Manrope({ weight: '400', subsets: ['latin'] });

const SERVICES = [
    'In Person - New Patient Consultation',
    'In Person - Follow Up Consultation',
    'Telephone Consultation',
    'Video Consultation'
] as const;

const DISABLED_REASONS: Record<string, string> = {
    'In Person - New Patient Consultation': 'Not available for returning patients',
    'In Person - Follow Up Consultation': 'Requires a prior appointment with Scott'
};

export default function BookingAppointment() {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState('');
    const [selectedSlotId, setSelectedSlotId] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [availableSlots, setAvailableSlots] = useState<AvailableSlots | null>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        mobileNumber: '',
        service: ''
    });

    // Medicare & patient history state
    const [isMedicareHolder, setIsMedicareHolder] = useState(false);
    const [patientHistory, setPatientHistory] = useState<PatientHistory | null>(null);
    const [isCheckingHistory, setIsCheckingHistory] = useState(false);
    const [historyError, setHistoryError] = useState(false);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Determine which services are disabled based on history
    const getDisabledServices = useCallback((): Set<string> => {
        const disabled = new Set<string>();

        // If still loading or no history yet, enable all
        if (!patientHistory || isCheckingHistory) return disabled;

        const isNewPatient = !patientHistory.hasPreviousBooking;
        const hasInPersonThisYear = patientHistory.hasInPersonThisYear;

        // Based on client table conditions
        if (isMedicareHolder) {
            if (hasInPersonThisYear) {
                // Medicare + Has in-person visit
                // Option 1 = Disabled, Option 2,3,4 = Enabled (for returning folks)
                disabled.add('In Person - New Patient Consultation');
                if (isNewPatient) disabled.add('In Person - Follow Up Consultation');
            } else {
                // Medicare + No in-person visit
                // Option 1 = Enabled (even for old patients, to get their $0 first visit), Option 2,3,4 = Enabled
                // Still disable Follow Up if they are completely new (never seen before)
                if (isNewPatient) {
                    disabled.add('In Person - Follow Up Consultation');
                }
            }
        } else {
            // Non-Medicare logic
            if (!isNewPatient) {
                disabled.add('In Person - New Patient Consultation');
            } else {
                disabled.add('In Person - Follow Up Consultation');
            }
        }

        return disabled;
    }, [patientHistory, isCheckingHistory, isMedicareHolder]);

    // Debounced email lookup
    const lookupPatientHistory = useCallback((email: string) => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setPatientHistory(null);
            setHistoryError(false);
            return;
        }

        debounceTimerRef.current = setTimeout(async () => {
            try {
                setIsCheckingHistory(true);
                setHistoryError(false);
                const history = await appointmentAPI.getPatientHistory(email);
                setPatientHistory(history);
            } catch (error) {
                console.error('Error checking patient history:', error);
                setPatientHistory({ hasPreviousBooking: false, hasInPersonThisYear: false });
                setHistoryError(true);
            } finally {
                setIsCheckingHistory(false);
            }
        }, 500);
    }, []);

    // Clear selected service if it becomes disabled
    useEffect(() => {
        const disabled = getDisabledServices();
        if (formData.service && disabled.has(formData.service)) {
            setFormData(prev => ({ ...prev, service: '' }));
        }
    }, [patientHistory, isCheckingHistory, getDisabledServices, formData.service]);

    // Show Medicare info banners?
    const showMedicareBanners = isMedicareHolder && patientHistory && !isCheckingHistory;

    // Step 2: Modal step state (form → billing)
    const [modalStep, setModalStep] = useState<'form' | 'billing'>('form');

    // Billing calculation
    const calculateBilling = useCallback(() => {
        const isReturning = patientHistory?.hasPreviousBooking ?? false;
        const hasInPersonThisYear = patientHistory?.hasInPersonThisYear ?? false;
        const patientType = isReturning ? 'Returning' : 'New';

        // Definitions for options
        const isOption1 = formData.service === 'In Person - New Patient Consultation';

        if (isMedicareHolder) {
            if (hasInPersonThisYear) {
                // Medicare + Has in-person visit this calendar year
                // Cost: $0 Bulk Billed for all enabled options
                return { amount: 0, isBulkBilled: true, patientType };
            } else {
                // Medicare + No in-person visit this calendar year
                if (isOption1) {
                    // Option 1 = $0
                    return { amount: 0, isBulkBilled: true, patientType };
                } else {
                    // Options 2, 3, 4 = $64
                    return { amount: 64, isBulkBilled: false, patientType };
                }
            }
        }

        // Non-Medicare cases below
        if (isReturning) {
            return { amount: 32, isBulkBilled: false, patientType };
        }
        return { amount: 64, isBulkBilled: false, patientType };
    }, [isMedicareHolder, patientHistory, formData.service]);

    const handleProceedToBilling = () => {
        if (!formData.fullName || !formData.email || !formData.mobileNumber || !formData.service) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Information',
                text: 'Please fill in all required fields.',
                background: '#1f2937',
                color: '#fff',
                confirmButtonColor: '#f59e0b'
            });
            return;
        }
        setModalStep('billing');
    };

    // Load available slots when component mounts or month changes
    useEffect(() => {
        loadAvailableSlots();
    }, [currentMonth]);

    const loadAvailableSlots = async () => {
        try {
            setIsLoading(true);
            const doctorId = 'scott_01';
            const monthString = dateUtils.getMonthString(currentMonth);

            const slots = await appointmentAPI.getAvailableSlots({
                doctorId,
                month: monthString
            });

            setAvailableSlots(slots);
        } catch (error) {
            console.error('Error loading slots:', error);
            Swal.fire({
                icon: 'error',
                title: 'Failed to Load Slots',
                text: 'Unable to load available time slots. Please try again.',
                background: '#1f2937',
                color: '#fff',
                confirmButtonColor: '#0891b2'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
        setSelectedTime('');
        setSelectedSlotId('');
    };

    const handleTimeSelect = (time: string, slotId: string) => {
        setSelectedTime(time);
        setSelectedSlotId(slotId);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        let finalValue = value;
        
        // Prevent alphabets in mobile number
        if (name === 'mobileNumber') {
            finalValue = finalValue.replace(/\D/g, ''); // Keep only digits
        }

        setFormData(prev => ({
            ...prev,
            [name]: finalValue
        }));

        // Trigger patient history lookup when email changes
        if (name === 'email') {
            lookupPatientHistory(value);
        }
    };

    const handleBookAppointment = async () => {
        if (!selectedSlotId || !formData.fullName || !formData.email || !formData.mobileNumber || !formData.service) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Information',
                text: 'Please fill in all required fields and select a time slot.',
                background: '#1f2937',
                color: '#fff',
                confirmButtonColor: '#f59e0b'
            });
            return;
        }

        try {
            setIsLoading(true);

            const billing = calculateBilling();

            if (billing.amount === 0) {
                // Branch A — Amount is $0 (Bulk Billed)
                await appointmentAPI.bookAppointment({
                    slotId: selectedSlotId,
                    patientName: formData.fullName,
                    patientEmail: formData.email,
                    patientMobile: formData.mobileNumber,
                    service: formData.service,
                    amountPaid: 0,
                    isMedicare: isMedicareHolder,
                    paymentStatus: 'bulk_billed',
                });

                // Reset form and close modal
                setFormData({
                    fullName: '',
                    email: '',
                    mobileNumber: '',
                    service: ''
                });
                setIsMedicareHolder(false);
                setPatientHistory(null);
                setHistoryError(false);
                setModalStep('form');
                setSelectedDate(null);
                setSelectedTime('');
                setSelectedSlotId('');
                setIsModalOpen(false);

                // Reload available slots
                await loadAvailableSlots();

                Swal.fire({
                    icon: 'success',
                    title: 'Appointment Booked!',
                    text: 'Your bulk-billed appointment has been successfully scheduled. You will receive a confirmation email shortly.',
                    background: '#1f2937',
                    color: '#fff',
                    confirmButtonColor: '#10b981',
                    timer: 4000,
                    showConfirmButton: true,
                    timerProgressBar: true
                });
            } else {
                // Branch B — Amount is $32 or $64 (Paid)
                const session = await appointmentAPI.createCheckoutSession({
                    slotId: selectedSlotId,
                    patientName: formData.fullName,
                    patientEmail: formData.email,
                    patientMobile: formData.mobileNumber,
                    service: formData.service,
                    amount: billing.amount,
                    isMedicare: isMedicareHolder,
                    patientType: billing.patientType,
                });

                // Redirect user to Stripe Checkout
                window.location.href = session.url;
            }
        } catch (error: any) {
            console.error('Error booking appointment:', error);
            Swal.fire({
                icon: 'error',
                title: 'Booking Failed',
                text: error.message || 'Failed to book appointment. Please try again.',
                background: '#1f2937',
                color: '#fff',
                confirmButtonColor: '#ef4444'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalStep('form');
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
        const newMonth = new Date(currentMonth);
        newMonth.setDate(1); // Set to 1st of the month to prevent day overflow (e.g. Mar 31 -> Apr 31 -> May 1)
        if (direction === 'prev') {
            newMonth.setMonth(newMonth.getMonth() - 1);
        } else {
            newMonth.setMonth(newMonth.getMonth() + 1);
        }
        setCurrentMonth(newMonth);
        setSelectedDate(null);
        setSelectedTime('');
        setSelectedSlotId('');
    };

    const getAvailableTimesForDate = (date: Date) => {
        if (!availableSlots) return [];

        const dateString = dateUtils.formatDateForAPI(date);
        let slots = availableSlots.slotsByDate[dateString] || [];

        // Filter out past slots today using Australia/Brisbane timezone
        const nowBrisbaneStr = new Date().toLocaleString('en-US', { timeZone: 'Australia/Brisbane' });
        const nowBrisbane = new Date(nowBrisbaneStr);
        
        // date argument here is local browser date that matches the selected calendar tile.
        // We only filter if the selected date matches TODAY in Brisbane.
        if (
            date.getFullYear() === nowBrisbane.getFullYear() &&
            date.getMonth() === nowBrisbane.getMonth() &&
            date.getDate() === nowBrisbane.getDate()
        ) {
            const currentHour = nowBrisbane.getHours();
            const currentMinute = nowBrisbane.getMinutes();

            slots = slots.filter(slot => {
                const time24 = convertTo24Hour(slot.startTime);
                const [slotHour, slotMinute] = time24.split(':').map(Number);
                
                if (slotHour < currentHour) return false;
                if (slotHour === currentHour && slotMinute <= currentMinute) return false;
                return true;
            });
        }

        // Sort slots by time in chronological order (morning to evening)
        return slots.sort((a, b) => {
            // Convert time strings to comparable format
            const timeA = convertTo24Hour(a.startTime);
            const timeB = convertTo24Hour(b.startTime);
            return timeA.localeCompare(timeB);
        });
    };

    // Helper function to convert 12-hour format to 24-hour format for sorting
    const convertTo24Hour = (time12h: string): string => {
        const [time, modifier] = time12h.split(' ');
        let [hours, minutes] = time.split(':');

        if (hours === '12') {
            hours = '00';
        }

        if (modifier === 'PM') {
            hours = (parseInt(hours, 10) + 12).toString();
        }

        // Pad with zeros if needed
        hours = hours.padStart(2, '0');
        minutes = minutes.padStart(2, '0');

        return `${hours}:${minutes}`;
    };

    const isDateAvailable = (date: Date) => {
        if (!availableSlots) return false;

        const dateString = dateUtils.formatDateForAPI(date);
        return availableSlots.availableDates.includes(dateString);
    };

    const generateCalendarDays = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        // Get first day of month and how many days in month
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        // Get previous month's last few days
        const prevMonth = new Date(year, month - 1, 0);
        const daysInPrevMonth = prevMonth.getDate();

        const days = [];

        // Previous month days
        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            const day = daysInPrevMonth - i;
            const date = new Date(year, month - 1, day);
            days.push(
                <button
                    key={`prev-${day}`}
                    className="w-10 h-10 text-[#969696] hover:bg-gray-600 bg-[#F5F5F540] transition-colors"
                    disabled
                >
                    {day}
                </button>
            );
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isAvailable = isDateAvailable(date);
            const isSelected = selectedDate &&
                date.getFullYear() === selectedDate.getFullYear() &&
                date.getMonth() === selectedDate.getMonth() &&
                date.getDate() === selectedDate.getDate();
            // Compare dates properly - a date is only past if it's before today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dateToCompare = new Date(date);
            dateToCompare.setHours(0, 0, 0, 0);
            const isPast = dateToCompare < today;

            days.push(
                <button
                    key={day}
                    onClick={() => isAvailable && !isPast && handleDateSelect(date)}
                    disabled={!isAvailable || isPast}
                    className={`w-10 h-10 transition-colors ${isSelected
                        ? 'bg-cyan-500 text-white font-medium'
                        : isAvailable && !isPast
                            ? 'text-white hover:bg-gray-600 bg-[#F5F5F540]'
                            : isPast
                                ? 'text-[#969696] bg-[#F5F5F540] cursor-not-allowed'
                                : 'text-[#969696] bg-[#F5F5F540] cursor-not-allowed'
                        }`}
                >
                    {day}
                </button>
            );
        }

        // Next month days to fill the grid
        const totalCells = 42; // 6 rows × 7 days
        const remainingCells = totalCells - days.length;

        for (let day = 1; day <= remainingCells; day++) {
            const date = new Date(year, month + 1, day);
            days.push(
                <button
                    key={`next-${day}`}
                    className="w-10 h-10 text-[#969696] hover:bg-gray-600 bg-[#F5F5F540] transition-colors"
                    disabled
                >
                    {day}
                </button>
            );
        }

        return days;
    };

    return (
        <>
            <div className='bg-[#000B1266] w-full flex justify-center p-6 relative xl:mx-20 md:mx-20 mx-auto'>
                <div className="absolute xl:left-1/16 xl:top-1/2 w-fit xl:-translate-y-1/2 xl:-translate-x-1/2 xl:-rotate-90 md:px-0 px-1 xl:bg-gradient-to-l from-[#006AC0FA]/10 to-transparent text-center xl:text-left mb-10 xl:mb-0  origin-center">
                    <h1 className={`${bebasNeue.className} text-white/20 md:max-xl:text-[80px] max-xl:text-[50px] md:text-[60px] sm:text-[60px] xl:text-[115px] font-bold md:whitespace-nowrap tracking-[0.02em]`}>
                        BOOK APPOINTMENT
                    </h1>
                </div>
                <div className="w-full xl:ml-40 md:ml-0 ml-0 xl:mt-10 md:mt-28 mt-20 max-w-4xl z-10">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                        <div>
                            <h2 className="text-white text-2xl font-semibold mb-6">Select Date</h2>

                            <div className="bg-[#67676775] p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <button
                                        className="text-white p-1 hover:bg-gray-600 rounded"
                                        onClick={() => navigateMonth('prev')}
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <h3 className="text-white text-lg font-medium">
                                        {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                    </h3>
                                    <button
                                        className="text-white p-1 hover:bg-gray-600 rounded"
                                        onClick={() => navigateMonth('next')}
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="grid grid-cols-7 gap-1">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                        <div key={day} className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-medium bg-[#FFFFFF40]">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-7 gap-1 gap-y-4 mt-4">
                                    {isLoading ? (
                                        <div className="col-span-7 text-center text-white py-4">
                                            Loading available dates...
                                        </div>
                                    ) : (
                                        generateCalendarDays()
                                    )}
                                </div>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-white text-2xl font-semibold mb-6">Select Time</h2>

                            <div className="space-y-4 xl:h-[455px] max-xl:max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                                {!selectedDate ? (
                                    <div className="text-center text-white/70 py-8">
                                        Please select a date first to see available time slots.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        {getAvailableTimesForDate(selectedDate).length === 0 ? (
                                            <div className="col-span-2 text-center text-white/70 py-8">
                                                No available time slots for this date.
                                            </div>
                                        ) : (
                                            getAvailableTimesForDate(selectedDate).map((slot) => (
                                                <button
                                                    key={slot._id}
                                                    onClick={() => handleTimeSelect(slot.startTime, slot._id)}
                                                    className={`py-4 px-6 font-medium transition-all duration-200 ${selectedTime === slot.startTime
                                                        ? 'bg-gradient-to-br from-[#05BAB1] to-[#027AEF] border border-[#FFFFFF40] text-white'
                                                        : 'bg-[#E8FCFF40] text-white/80 hover:bg-[#E8FCFF40]/80 hover:text-white'
                                                        }`}
                                                >
                                                    {slot.startTime}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="xl:pt-20 pt-8 flex justify-center items-center">
                        <button
                            onClick={openModal}
                            disabled={!selectedDate || !selectedTime || isLoading}
                            className={`w-fit px-8 py-4 font-medium text-lg transition-all duration-200 ${selectedDate && selectedTime && !isLoading
                                ? 'bg-transparent border-2 border-white/40 text-white hover:border-white/70 hover:bg-white/10 cursor-pointer'
                                : 'bg-gray-600 border-2 border-gray-500 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            {isLoading ? 'Loading...' : 'Schedule Now'}
                        </button>
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 w-full z-0 overflow-hidden">
                    <img src="/BgBlur.svg" alt="" className="w-full h-full object-cover" />
                </div>

                {/* Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={closeModal}
                        ></div>

                        {/* Modal Content */}
                        <div className="relative bg-gradient-to-br from-[#314A75BF] to-[#314A75A6] backdrop-blur-3xl p-8 py-14 w-full max-w-lg mx-auto drop-shadow-[0px_2px_4px_0px_#314A75BF,0px_7px_7px_0px_#314A75A6]  shadow-2xl">
                            {/* Close Button */}
                            <button
                                onClick={closeModal}
                                className="absolute md:top-8 md:right-8 top-4 right-4 text-white/70 hover:text-white hover:rotate-180 transition-all duration-200"
                            >
                                <img src="/close.svg" alt="Close" className='h-9 w-9' />
                            </button>

                            {/* Step 1: Form */}
                            {modalStep === 'form' && (
                                <>
                                    {/* Modal Header */}
                                    <div className="text-center mb-8">
                                        <h2 className={`text-5xl font-bold text-white ${bebasNeue.className}`}>
                                            FILL THE <span className="text-cyan-400">DETAILS</span>
                                        </h2>
                                    </div>

                                    {/* Form */}
                                    <form className={`space-y-6 lg:px-20 md:px-10 px-4 ${manrope.className}`}>
                                        {/* Full Name */}
                                        <div>
                                            <input
                                                type="text"
                                                name="fullName"
                                                placeholder="Your Full Name"
                                                value={formData.fullName}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 bg-white rounded border-0 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                                                required
                                            />
                                        </div>

                                        {/* Email */}
                                        <div>
                                            <input
                                                type="email"
                                                name="email"
                                                placeholder="Your Email Address"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 bg-white rounded border-0 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                                                required
                                            />
                                        </div>

                                        {/* Mobile Number */}
                                        <div>
                                            <input
                                                type="tel"
                                                name="mobileNumber"
                                                placeholder="Your Mobile Number"
                                                value={formData.mobileNumber}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 bg-white rounded border-0 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                                                required
                                            />
                                        </div>

                                        {/* Medicare Checkbox */}
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                id="medicareCheckbox"
                                                checked={isMedicareHolder}
                                                onChange={(e) => setIsMedicareHolder(e.target.checked)}
                                                className="w-5 h-5 rounded border-2 border-cyan-400 bg-white/10 text-cyan-500 focus:ring-cyan-400 focus:ring-2 cursor-pointer accent-cyan-500"
                                            />
                                            <label
                                                htmlFor="medicareCheckbox"
                                                className="text-white text-sm font-medium cursor-pointer select-none"
                                            >
                                                I am a Medicare card holder
                                            </label>
                                        </div>

                                        {/* Service Selection */}
                                        <div className="relative">
                                            <select
                                                name="service"
                                                value={formData.service}
                                                onChange={handleInputChange}
                                                disabled={isCheckingHistory}
                                                className={`w-full px-4 py-3 bg-white rounded border-0 text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-400 ${isCheckingHistory ? 'opacity-60 cursor-wait' : ''
                                                    }`}
                                                required
                                            >
                                                <option value="">Select Service</option>
                                                {SERVICES.map((service) => {
                                                    const disabled = getDisabledServices().has(service);
                                                    return (
                                                        <option
                                                            key={service}
                                                            value={service}
                                                            disabled={disabled}
                                                            title={disabled ? (DISABLED_REASONS[service] || 'Not available') : ''}
                                                            style={disabled ? { color: '#9ca3af', fontStyle: 'italic' } : {}}
                                                        >
                                                            {service}{disabled ? ' (unavailable)' : ''}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                            {isCheckingHistory && (
                                                <div className="absolute right-10 top-1/2 -translate-y-1/2">
                                                    <svg className="animate-spin h-5 w-5 text-cyan-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                </div>
                                            )}
                                        </div>

                                        {/* History error warning */}
                                        {historyError && (
                                            <div className="flex items-center gap-2 px-3 py-2 bg-yellow-500/20 border border-yellow-500/40 rounded text-yellow-200 text-xs">
                                                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                <span>Could not verify appointment history. All services are shown.</span>
                                            </div>
                                        )}



                                        {/* Proceed to Billing Summary Button */}
                                        <div className="pt-4 flex justify-center">
                                            <button
                                                type="button"
                                                onClick={handleProceedToBilling}
                                                disabled={isLoading || isCheckingHistory}
                                                className={`w-fit cursor-pointer font-semibold py-3 px-6 transition-colors duration-300 ${isLoading || isCheckingHistory
                                                    ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                                                    : 'bg-gradient-to-br from-[#0583F4] to-[#09B9AC] hover:bg-gradient-to-tl hover:from-[#09B9AC] hover:to-[#0583F4] text-white'
                                                    }`}
                                            >
                                                {isCheckingHistory ? 'Checking...' : 'Continue'}
                                            </button>
                                        </div>
                                    </form>
                                </>
                            )}

                            {/* Step 2: Billing Summary */}
                            {modalStep === 'billing' && (() => {
                                const billing = calculateBilling();
                                return (
                                    <div className={`${manrope.className}`}>
                                        {/* Billing Header */}
                                        <div className="text-center mb-8">
                                            <h2 className={`text-5xl font-bold text-white ${bebasNeue.className}`}>
                                                BOOKING <span className="text-cyan-400">SUMMARY</span>
                                            </h2>
                                        </div>

                                        <div className="lg:px-20 md:px-10 px-4 space-y-5">
                                            {/* Summary Details */}
                                            <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden">
                                                <div className="divide-y divide-white/10">
                                                    <div className="flex justify-between items-center px-5 py-3.5">
                                                        <span className="text-white/60 text-sm">Service</span>
                                                        <span className="text-white text-sm font-medium text-right max-w-[60%]">{formData.service}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center px-5 py-3.5">
                                                        <span className="text-white/60 text-sm">Patient</span>
                                                        <span className="text-white text-sm font-medium">{billing.patientType}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center px-5 py-3.5">
                                                        <span className="text-white/60 text-sm">Medicare</span>
                                                        <span className="text-white text-sm font-medium">
                                                            {isMedicareHolder ? (
                                                                <span className="flex items-center gap-1.5">Yes <span className="text-green-400">✅</span></span>
                                                            ) : 'No'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center px-5 py-4 bg-white/5">
                                                        <span className="text-white/80 text-sm font-semibold">Amount Due</span>
                                                        <span className={`text-lg font-bold ${billing.isBulkBilled ? 'text-green-400' : 'text-cyan-400'
                                                            }`}>
                                                            ${billing.amount.toFixed(2)}
                                                            {billing.isBulkBilled && (
                                                                <span className="text-green-400 text-xs font-medium ml-1.5">(Bulk Billed)</span>
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bulk Billed Info Message */}
                                            {billing.isBulkBilled && (
                                                <div className="flex items-start gap-2.5 px-4 py-3 bg-green-500/10 border border-green-400/30 rounded-lg text-green-100 text-sm leading-relaxed">
                                                    <svg className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                    <span>Eligible services are 100% bulk billed, meaning there is no out-of-pocket cost where Medicare criteria are met.</span>
                                                </div>
                                            )}

                                            {/* Paid Booking Info Message */}
                                            {!billing.isBulkBilled && (
                                                <div className="flex items-start gap-2.5 px-4 py-3 bg-[#e0f2fe]/10 border border-[#0284c7]/30 rounded-lg text-blue-100 text-sm leading-relaxed mb-2">
                                                    <svg className="w-5 h-5 mt-0.5 flex-shrink-0 text-[#38bdf8]" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                    </svg>
                                                    <span>If Scott rejects your appointment request for any reason, your payment will be refunded to your original payment method automatically within 5-10 business days.</span>
                                                </div>
                                            )}

                                            {/* Action Buttons */}
                                            <div className="flex items-center justify-between pt-4 gap-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setModalStep('form')}
                                                    className="px-6 py-3 border border-white/30 text-white font-semibold hover:bg-white/10 hover:border-white/50 transition-all duration-200 cursor-pointer"
                                                >
                                                    Back
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleBookAppointment}
                                                    disabled={isLoading}
                                                    className={`px-6 py-3 font-semibold transition-all duration-300 cursor-pointer ${isLoading
                                                            ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                                                            : 'bg-gradient-to-br from-[#0583F4] to-[#09B9AC] hover:bg-gradient-to-tl hover:from-[#09B9AC] hover:to-[#0583F4] text-white'
                                                        }`}
                                                >
                                                    {isLoading
                                                        ? 'Processing...'
                                                        : billing.isBulkBilled
                                                            ? 'Confirm Booking'
                                                            : 'Proceed to Payment'
                                                    }
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
