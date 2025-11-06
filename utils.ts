import type { Appointment } from './types';

export const formatDateKey = (date: Date): string => {
  // Use local date parts to avoid timezone issues where .toISOString() could yield the previous day.
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseDateKey = (dateKey: string): Date => {
    const [year, month, day] = dateKey.split('-').map(Number);
    // month is 0-indexed in JS Date
    return new Date(year, month - 1, day);
};

export const formatDisplayDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    const formattedDate = new Intl.DateTimeFormat('es-ES', options).format(date);
    // Capitalize the first letter for a better look
    return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
};


export interface TimeSlotAvailability {
    time: string;
    isAvailableIsmail: boolean;
    isAvailableAbdo: boolean;
}

export const generateTimeSlots = (date: Date, bookedAppointmentsForDay: Appointment[]): TimeSlotAvailability[] => {
    // Domingo (Sunday) is day 0. The shop is closed on Sundays.
    if (date.getDay() === 0) {
        return [];
    }

    const allSlots: string[] = [];
    
    // Mañana: 10:00 a 13:30
    for (let h = 10; h < 14; h++) {
        allSlots.push(`${String(h).padStart(2, '0')}:00`);
        allSlots.push(`${String(h).padStart(2, '0')}:30`);
    }
    
    // Tarde: 16:00 a 20:00
    for (let h = 16; h < 20; h++) {
        allSlots.push(`${String(h).padStart(2, '0')}:00`);
        allSlots.push(`${String(h).padStart(2, '0')}:30`);
    }
    allSlots.push('20:00');

    const now = new Date();
    const isToday = formatDateKey(date) === formatDateKey(now);

    return allSlots.map(time => {
        const [hour, minute] = time.split(':').map(Number);
        const slotDate = new Date(date);
        slotDate.setHours(hour, minute, 0, 0);

        const isPast = isToday && slotDate < now;

        const isBookedForIsmail = bookedAppointmentsForDay.some(
            app => app.time === time && app.barber === 'Ismail'
        );
        const isBookedForAbdo = bookedAppointmentsForDay.some(
            app => app.time === time && app.barber === 'Abdo'
        );

        return {
            time,
            isAvailableIsmail: !isPast && !isBookedForIsmail,
            isAvailableAbdo: !isPast && !isBookedForAbdo,
        };
    });
};