import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { Appointment, BookedAppointments, Customer, VisitRecord, MissedAppointmentRecord, Service } from './types';
import { formatDateKey, generateTimeSlots, formatDisplayDate, TimeSlotAvailability, parseDateKey } from './utils';
import { GoogleGenAI, FunctionDeclaration, Type, GenerateContentResponse } from '@google/genai';

// --- ICONS (as stateless components) ---
const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const PhoneIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
);

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const ExclamationTriangleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

const AdminIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
);

const BarberIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
);

const KeyIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7h2a2 2 0 012 2v4a2 2 0 01-2 2h-2m-6 4H7a2 2 0 01-2-2v-4a2 2 0 012-2h2.5" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12V9a2.98 2.98 0 012-2.828M12 12v3m0-3h-2m2 0h2" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a1 1 0 11-2 0 1 1 0 012 0z" />
    </svg>
);

const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const ClipboardCopyIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const CodeBracketIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
    </svg>
);

const ScissorsIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);


// --- HELPER DATA ---
const getInitialBookedAppointments = (): BookedAppointments => {
  try {
    const item = window.localStorage.getItem('bookedAppointments');
    if (item) {
      return JSON.parse(item);
    }
  } catch (error) {
    console.error("Error reading appointments from localStorage", error);
  }

  const todayKey = formatDateKey(new Date());
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = formatDateKey(tomorrow);
  
  return {
    [todayKey]: [
      { time: '11:00', customerName: 'Juan Pérez', customerPhone: '555123456', barber: 'Ismail', service: 'Corte y barba' },
      { time: '11:00', customerName: 'Pedro Gómez', customerPhone: '555112233', barber: 'Abdo', service: 'Corte de pelo' },
      { time: '17:30', customerName: 'Maria García', customerPhone: '555654321', barber: 'Ismail', service: 'Arreglo de barba' },
    ],
    [tomorrowKey]: [
      { time: '10:00', customerName: 'Carlos Sánchez', customerPhone: '555987654', barber: 'Abdo', service: 'Corte y barba' },
    ]
  };
};

const getInitialCustomers = (): Customer[] => {
  try {
    const item = window.localStorage.getItem('barbershopCustomers');
    if (item) {
      return JSON.parse(item);
    }
  } catch (error) {
    console.error("Error reading customers from localStorage", error);
  }
  return [];
};

const getInitialVisitHistory = (): VisitRecord[] => {
    try {
        const item = window.localStorage.getItem('visitHistory');
        if (item) {
            return JSON.parse(item);
        }
    } catch (error) {
        console.error("Error reading visit history from localStorage", error);
    }
    return [];
};

const getInitialMissedAppointments = (): MissedAppointmentRecord[] => {
    try {
        const item = window.localStorage.getItem('missedAppointments');
        if (item) {
            return JSON.parse(item);
        }
    } catch (error) {
        console.error("Error reading missed appointments from localStorage", error);
    }
    return [];
};


// --- UI COMPONENTS ---
const Header = () => (
    <header className="bg-stone-900 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4 text-center">
            <h1 className="text-4xl font-bold tracking-wider">Barbershop-Abde</h1>
            <p className="text-stone-300 mt-1">Tu estilo, nuestra pasión.</p>
            <a href="tel:614229897" className="mt-3 inline-flex items-center text-green-400 text-2xl font-bold hover:text-green-300 transition-colors duration-200">
                <PhoneIcon className="h-6 w-6 mr-2" />
                614 229 897
            </a>
        </div>
    </header>
);

interface TimeSlotGridProps {
    slots: TimeSlotAvailability[];
    selectedSlot: { time: string; barber: string } | null;
    onSelectSlot: (time: string, barber: 'Ismail' | 'Abdo') => void;
}

const TimeSlotGrid: React.FC<TimeSlotGridProps> = ({ slots, selectedSlot, onSelectSlot }) => {
    const renderSlot = ({ time, isAvailableIsmail, isAvailableAbdo }: TimeSlotAvailability) => (
        <div key={time} className="rounded-lg border border-gray-200 p-3 text-center transition-all duration-200 shadow-sm hover:shadow-lg bg-white">
            <p className="font-bold text-lg text-stone-800 mb-3">{time}</p>
            <div className="grid grid-cols-2 gap-2">
                {/* Ismail's Button */}
                <button
                    disabled={!isAvailableIsmail}
                    onClick={() => onSelectSlot(time, 'Ismail')}
                    className={`p-2 w-full rounded-md text-center font-semibold transition-colors duration-200 text-xs sm:text-sm
                    ${!isAvailableIsmail ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : ''}
                    ${isAvailableIsmail && selectedSlot?.time === time && selectedSlot?.barber === 'Ismail' ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-700' : ''}
                    ${isAvailableIsmail && !(selectedSlot?.time === time && selectedSlot?.barber === 'Ismail') ? 'bg-white hover:bg-blue-100 text-blue-800 border border-blue-200' : ''}
                    `}
                >
                    Ismail
                </button>
                {/* Abdo's Button */}
                <button
                    disabled={!isAvailableAbdo}
                    onClick={() => onSelectSlot(time, 'Abdo')}
                    className={`p-2 w-full rounded-md text-center font-semibold transition-colors duration-200 text-xs sm:text-sm
                    ${!isAvailableAbdo ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : ''}
                    ${isAvailableAbdo && selectedSlot?.time === time && selectedSlot?.barber === 'Abdo' ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-700' : ''}
                    ${isAvailableAbdo && !(selectedSlot?.time === time && selectedSlot?.barber === 'Abdo') ? 'bg-white hover:bg-blue-100 text-blue-800 border border-blue-200' : ''}
                    `}
                >
                    Abdo
                </button>
            </div>
        </div>
    );

    const morningSlots = slots.filter(slot => parseInt(slot.time.split(':')[0]) < 14);
    const eveningSlots = slots.filter(slot => parseInt(slot.time.split(':')[0]) >= 16);

    return (
        <div className="mt-4">
            {morningSlots.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {morningSlots.map(renderSlot)}
                </div>
            )}
            
            {morningSlots.length > 0 && eveningSlots.length > 0 && (
                <hr className="border-t-2 border-dashed border-gray-300 my-6" />
            )}

            {eveningSlots.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {eveningSlots.map(renderSlot)}
                </div>
            )}
        </div>
    );
};


interface BookingFormProps {
    customerName: string;
    setCustomerName: (name: string) => void;
    customerPhone: string;
    setCustomerPhone: (phone: string) => void;
    onSubmit: () => void;
    error: string;
    nameInputRef: React.RefObject<HTMLInputElement>;
    selectedService: Service | null;
    onSelectService: (service: Service) => void;
    isModification: boolean;
}

const BookingForm: React.FC<BookingFormProps> = ({ customerName, setCustomerName, customerPhone, setCustomerPhone, onSubmit, error, nameInputRef, selectedService, onSelectService, isModification }) => {
    const services: Service[] = ['Corte de pelo', 'Arreglo de barba', 'Corte y barba'];
    
    return (
    <div className="space-y-4 mt-6">
        <div>
            <label htmlFor="customerName" className="block text-sm font-medium text-stone-700">Tu Nombre</label>
            <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    id="customerName"
                    value={customerName}
                    ref={nameInputRef}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2"
                    placeholder="Tu nombre"
                    aria-label="Tu Nombre"
                    disabled={isModification}
                />
            </div>
        </div>
        <div>
            <label htmlFor="customerPhone" className="block text-sm font-medium text-stone-700">Número de teléfono</label>
            <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="tel"
                    id="customerPhone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2"
                    placeholder="600 123 456"
                    aria-label="Número de teléfono del cliente"
                    disabled={isModification}
                />
            </div>
        </div>
        
        <div>
            <label className="block text-sm font-medium text-stone-700">Elige un servicio</label>
            <div className="mt-2 grid grid-cols-1 gap-2">
                {services.map(service => (
                    <button
                        key={service}
                        type="button"
                        onClick={() => onSelectService(service)}
                        className={`w-full text-left p-3 rounded-md border text-sm font-semibold transition-colors duration-200 flex items-center
                            ${selectedService === service 
                                ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-500' 
                                : 'bg-white hover:bg-gray-50 text-stone-800 border-gray-300'
                            }`}
                    >
                        <span className={`w-5 h-5 mr-3 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${selectedService === service ? 'border-white bg-blue-600' : 'border-gray-400 bg-white'}`}>
                            {selectedService === service && <CheckIcon className="w-3 h-3 text-white" />}
                        </span>
                        {service}
                    </button>
                ))}
            </div>
        </div>

        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <button
            onClick={onSubmit}
            disabled={!selectedService}
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
            {isModification ? 'Confirmar Nuevo Horario' : 'Confirmar Cita'}
        </button>
    </div>
)};

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointment: Appointment | null;
    date: Date;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, appointment, date }) => {
    if (!isOpen || !appointment) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="confirmation-title">
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 max-w-sm w-full text-center">
                <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto" />
                <h3 id="confirmation-title" className="text-2xl font-bold text-stone-800 mt-4">¡Cita Confirmada!</h3>
                <p className="text-stone-600 mt-2">Gracias, {appointment.customerName}.</p>
                <div className="bg-blue-800 rounded-lg p-4 mt-6 text-left text-white">
                    <div className="space-y-2">
                        <p><strong className="text-blue-200">Fecha:</strong> {formatDisplayDate(date)}</p>
                        <p><strong className="text-blue-200">Hora:</strong> {appointment.time}</p>
                        <p><strong className="text-blue-200">Barbero:</strong> {appointment.barber}</p>
                        <p><strong className="text-blue-200">Servicio:</strong> {appointment.service}</p>
                    </div>
                    <div className="border-t border-blue-700 my-3"></div>
                    <div>
                        <p><strong className="text-blue-200">Contacto del Salón:</strong> 614229897</p>
                        <p className="text-xs text-blue-100 mt-1">
                            Si no puedes asistir a tu cita, por favor llama para cancelarla.
                        </p>
                    </div>
                </div>
                <p className="text-sm text-stone-500 mt-4">Te esperamos en la barbería.</p>
                <p className="text-xs text-stone-500 mt-2 font-semibold">
                    Para que no olvides tu cita, por favor, toma una captura de pantalla.
                </p>
                <button
                    onClick={onClose}
                    className="mt-6 w-full bg-stone-800 text-white font-bold py-2 px-4 rounded-lg hover:bg-stone-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-700"
                >
                    Cerrar
                </button>
            </div>
        </div>
    );
};

interface AdminModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointments: BookedAppointments;
    customers: Customer[];
    visitHistory: VisitRecord[];
    onCancelAppointment: (dateKey: string, appointment: Appointment) => void;
    onConfirmAttendance: (dateKey: string, appointment: Appointment) => void;
    onNoShow: (dateKey: string, appointment: Appointment) => void;
    onDeleteCustomer: (customer: Customer) => void;
}

const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose, appointments, customers, visitHistory, onCancelAppointment, onConfirmAttendance, onNoShow, onDeleteCustomer }) => {
    const [view, setView] = useState<'appointments' | 'customers' | 'history' | 'noshows' | 'tech'>('appointments');
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [historySearchTerm, setHistorySearchTerm] = useState('');
    const [noShowSearchTerm, setNoShowSearchTerm] = useState('');
    const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setView('appointments');
            setCustomerSearchTerm('');
            setHistorySearchTerm('');
            setNoShowSearchTerm('');
            setCopiedPhone(null);
        }
    }, [isOpen]);

    const handleCopyToClipboard = (phone: string) => {
        navigator.clipboard.writeText(phone);
        setCopiedPhone(phone);
        setTimeout(() => setCopiedPhone(null), 2000);
    };

    const sortedDates = Object.keys(appointments).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const todayKey = formatDateKey(new Date());

    const filteredCustomers = useMemo(() => {
        if (!customerSearchTerm) return customers;
        const normalizedSearch = customerSearchTerm.toLowerCase().replace(/\s/g, '');
        return customers.filter(c =>
            c.name.toLowerCase().replace(/\s/g, '').includes(normalizedSearch) ||
            c.phone.replace(/\s/g, '').includes(normalizedSearch)
        );
    }, [customers, customerSearchTerm]);
    
    const filteredHistory = useMemo(() => {
        if (!historySearchTerm) return visitHistory;
        const normalizedSearch = historySearchTerm.toLowerCase().replace(/\s/g, '');
        return visitHistory.filter(v =>
            v.customerName.toLowerCase().replace(/\s/g, '').includes(normalizedSearch) ||
            v.customerPhone.replace(/\s/g, '').includes(normalizedSearch)
        );
    }, [visitHistory, historySearchTerm]);

    const filteredNoShows = useMemo(() => {
        const customersWithNoShows = customers.filter(c => (c.noShowCount || 0) > 0);
        if (!noShowSearchTerm) return customersWithNoShows;
        const normalizedSearch = noShowSearchTerm.toLowerCase().replace(/\s/g, '');
        return customersWithNoShows.filter(c =>
            c.name.toLowerCase().replace(/\s/g, '').includes(normalizedSearch) ||
            c.phone.replace(/\s/g, '').includes(normalizedSearch)
        );
    }, [customers, noShowSearchTerm]);


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="admin-title">
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 max-w-lg w-full text-left flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-4">
                    <h3 id="admin-title" className="text-2xl font-bold text-stone-800">
                        {view === 'appointments' && 'Citas Reservadas'}
                        {view === 'customers' && 'Archivo de Clientes'}
                        {view === 'history' && 'Historial de Visitas'}
                        {view === 'noshows' && 'Registro de Ausencias'}
                        {view === 'tech' && 'Stack Tecnológico'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar ventana">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                 <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-2 sm:space-x-4 overflow-x-auto" aria-label="Tabs">
                        <button onClick={() => setView('appointments')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${view === 'appointments' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Citas</button>
                        <button onClick={() => setView('customers')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${view === 'customers' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Clientes</button>
                        <button onClick={() => setView('history')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${view === 'history' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Historial</button>
                        <button onClick={() => setView('noshows')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${view === 'noshows' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Ausencias</button>
                        <button onClick={() => setView('tech')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${view === 'tech' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Stack</button>
                    </nav>
                </div>

                <div className="overflow-y-auto flex-grow mt-4 pr-2">
                    {view === 'appointments' && (
                        <>
                        {sortedDates.filter(dateKey => appointments[dateKey]?.length > 0).length === 0 ? (
                            <p className="text-stone-600 text-center py-8">No hay ninguna cita reservada.</p>
                        ) : (
                            sortedDates.map(dateKey => {
                                const appointmentsForDay = appointments[dateKey];
                                if (!appointmentsForDay || appointmentsForDay.length === 0) return null;
                                
                                const isPastOrToday = dateKey <= todayKey;
                                const displayDate = formatDisplayDate(parseDateKey(dateKey));

                                return (
                                    <div key={dateKey} className="mb-6">
                                        <h4 className="text-lg font-semibold text-blue-800 bg-blue-100 p-2 rounded-md mb-3 sticky top-0">{displayDate}</h4>
                                        <ul className="space-y-3">
                                            {appointmentsForDay
                                                .slice()
                                                .sort((a, b) => a.time.localeCompare(b.time) || a.barber.localeCompare(b.barber))
                                                .map((app, index) => (
                                                    <li key={`${app.time}-${app.customerPhone}-${index}`} className="bg-stone-50 p-3 rounded-lg border border-stone-200 flex items-center justify-between">
                                                        <div>
                                                            <div className="flex items-center">
                                                                <span className="font-bold text-lg text-stone-800">{app.time}</span>
                                                                <span className="ml-3 text-sm font-semibold px-2 py-1 rounded-full bg-blue-200 text-blue-800">{app.barber}</span>
                                                            </div>
                                                            <div className="mt-2 text-sm text-stone-600">
                                                                <p className="flex items-center"><UserIcon className="h-4 w-4 mr-2 text-stone-400" /> {app.customerName}</p>
                                                                <p className="flex items-center mt-1"><PhoneIcon className="h-4 w-4 mr-2 text-stone-400" /> {app.customerPhone}</p>
                                                                <p className="flex items-center mt-1"><ScissorsIcon className="h-4 w-4 mr-2 text-stone-400" /> {app.service}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center ml-4 space-x-1 flex-shrink-0">
                                                            <button onClick={() => onConfirmAttendance(dateKey, app)} disabled={!isPastOrToday} className={`p-2 rounded-full transition-colors ${isPastOrToday ? 'text-green-600 hover:bg-green-100' : 'text-gray-400 cursor-not-allowed'}`} aria-label={`Confirmar asistencia de ${app.customerName}`}>
                                                                <CheckIcon className="h-5 w-5" />
                                                            </button>
                                                            <button onClick={() => onNoShow(dateKey, app)} disabled={!isPastOrToday} className={`p-2 rounded-full transition-colors ${isPastOrToday ? 'text-orange-500 hover:bg-orange-100' : 'text-gray-400 cursor-not-allowed'}`} aria-label={`Marcar como no presentado a ${app.customerName}`}>
                                                                <ExclamationTriangleIcon className="h-5 w-5" />
                                                            </button>
                                                            <button onClick={() => onCancelAppointment(dateKey, app)} className="p-2 text-red-500 hover:bg-red-100 rounded-full transition-colors" aria-label={`Cancelar cita de ${app.customerName}`}>
                                                                <TrashIcon className="h-5 w-5" />
                                                            </button>
                                                        </div>
                                                    </li>
                                            ))}
                                        </ul>
                                    </div>
                                );
                            })
                        )}
                        </>
                    )}
                    {view === 'customers' && (
                        <div className="space-y-4">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon className="h-5 w-5 text-gray-400" /></div>
                                <input type="text" placeholder="Buscar por nombre o teléfono..." value={customerSearchTerm} onChange={(e) => setCustomerSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            {filteredCustomers.length > 0 ? (
                                <ul className="space-y-2">
                                    {filteredCustomers.map(customer => (
                                        <li key={customer.phone} className="bg-stone-50 p-3 rounded-lg border border-stone-200 flex items-start justify-between">
                                            <div className="text-sm text-stone-700">
                                                <p className="font-semibold flex items-center"><UserIcon className="h-4 w-4 mr-2 text-stone-400" /> {customer.name}</p>
                                                <p className="mt-1 flex items-center"><PhoneIcon className="h-4 w-4 mr-2 text-stone-400" /> {customer.phone}</p>
                                                <div className="text-xs text-stone-500 mt-2 space-y-1 pl-6">
                                                  <p><span className="font-semibold">Visitas:</span> {customer.visitCount || 0}</p>
                                                  {customer.lastVisit && <p><span className="font-semibold">Última Visita:</span> {formatDisplayDate(parseDateKey(customer.lastVisit))}</p>}
                                                  {(customer.noShowCount || 0) > 0 && <p><span className="font-semibold text-red-600">Ausencias:</span> <span className="text-red-600 font-bold">{customer.noShowCount}</span></p>}
                                                </div>
                                            </div>
                                            <div className="flex flex-col space-y-2">
                                                <button onClick={() => onDeleteCustomer(customer)} className="p-2 text-red-500 hover:bg-red-100 rounded-full transition-colors flex-shrink-0" aria-label={`Eliminar cliente ${customer.name}`}>
                                                    <TrashIcon className="h-5 w-5" />
                                                </button>
                                                <button onClick={() => handleCopyToClipboard(customer.phone)} className={`p-2 rounded-full transition-colors flex-shrink-0 ${copiedPhone === customer.phone ? 'bg-green-100 text-green-600' : 'text-gray-500 hover:bg-gray-100'}`} aria-label={`Copiar teléfono de ${customer.name}`}>
                                                    {copiedPhone === customer.phone ? <CheckCircleIcon className="h-5 w-5" /> : <ClipboardCopyIcon className="h-5 w-5" />}
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-stone-600 text-center py-8">{customerSearchTerm ? 'No se encontraron clientes.' : 'No hay clientes en el archivo.'}</p>
                            )}
                        </div>
                    )}
                    {view === 'history' && (
                         <div className="space-y-4">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon className="h-5 w-5 text-gray-400" /></div>
                                <input type="text" placeholder="Buscar historial..." value={historySearchTerm} onChange={(e) => setHistorySearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            {filteredHistory.length > 0 ? (
                                <ul className="space-y-3">
                                    {filteredHistory.map((visit, index) => (
                                        <li key={`${visit.date}-${visit.time}-${visit.customerPhone}-${index}`} className="bg-stone-50 p-3 rounded-lg border border-stone-200">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-lg text-stone-800">{visit.time}</span>
                                                <span className="text-sm font-semibold">{formatDisplayDate(parseDateKey(visit.date))}</span>
                                            </div>
                                            <div className="mt-2 text-sm text-stone-600 pl-1">
                                                <p className="flex items-center"><UserIcon className="h-4 w-4 mr-2 text-stone-400" /> {visit.customerName}</p>
                                                <p className="flex items-center mt-1"><PhoneIcon className="h-4 w-4 mr-2 text-stone-400" /> {visit.customerPhone}</p>
                                                <p className="flex items-center mt-1"><BarberIcon className="h-4 w-4 mr-2 text-stone-400" /> {visit.barber}</p>
                                                <p className="flex items-center mt-1"><ScissorsIcon className="h-4 w-4 mr-2 text-stone-400" /> {visit.service}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-stone-600 text-center py-8">{historySearchTerm ? 'No se encontraron visitas.' : 'El historial de visitas está vacío.'}</p>
                            )}
                        </div>
                    )}
                    {view === 'noshows' && (
                         <div className="space-y-4">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon className="h-5 w-5 text-gray-400" /></div>
                                <input type="text" placeholder="Buscar por nombre o teléfono..." value={noShowSearchTerm} onChange={(e) => setNoShowSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500" />
                            </div>
                            {filteredNoShows.length > 0 ? (
                                <ul className="space-y-2">
                                    {filteredNoShows.map(customer => (
                                        <li key={customer.phone} className="bg-orange-50 p-3 rounded-lg border border-orange-200 flex items-center justify-between">
                                            <div className="text-sm">
                                                <p className="font-semibold text-stone-800 flex items-center"><UserIcon className="h-4 w-4 mr-2 text-orange-400" /> {customer.name}</p>
                                                <p className="mt-1 flex items-center text-stone-600"><PhoneIcon className="h-4 w-4 mr-2 text-orange-400" /> {customer.phone}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-red-600">{customer.noShowCount}</p>
                                                <p className="text-xs text-red-500">Ausencia(s)</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-stone-600 text-center py-8">{noShowSearchTerm ? 'No se encontraron clientes.' : 'No hay clientes con ausencias.'}</p>
                            )}
                        </div>
                    )}
                     {view === 'tech' && (
                        <div className="p-4 space-y-6 text-stone-700">
                            <div>
                                <h4 className="text-lg font-semibold text-stone-800 border-b pb-2 mb-3 flex items-center">
                                    <CodeBracketIcon className="h-6 w-6 mr-2 text-indigo-600"/>
                                    Propuesta de Stack Tecnológico
                                </h4>
                                <p className="text-sm text-stone-600">Esta es la pila de tecnología recomendada para una implementación completa y escalable de esta aplicación.</p>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <h5 className="font-bold">Frontend</h5>
                                    <ul className="list-disc list-inside ml-4 text-stone-600 mt-1">
                                        <li>React</li>
                                        <li>TypeScript</li>
                                        <li>Tailwind CSS</li>
                                    </ul>
                                </div>

                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <h5 className="font-bold">Backend</h5>
                                    <ul className="list-disc list-inside ml-4 text-stone-600 mt-1">
                                        <li>Python (Flask)</li>
                                    </ul>
                                </div>

                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <h5 className="font-bold">Base de Datos</h5>
                                    <ul className="list-disc list-inside ml-4 text-stone-600 mt-1">
                                        <li>SQL (PostgreSQL)</li>
                                    </ul>
                                </div>
                                
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <h5 className="font-bold">Notificaciones</h5>
                                    <ul className="list-disc list-inside ml-4 text-stone-600 mt-1">
                                        <li>SendGrid / Mailgun API</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                 <button
                    onClick={onClose}
                    className="mt-6 w-full bg-stone-800 text-white font-bold py-2 px-4 rounded-lg hover:bg-stone-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-700"
                >
                    Cerrar
                </button>
            </div>
        </div>
    );
};

interface CodeEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (code: string) => void;
    error: string;
    clearError: () => void;
}

const CodeEntryModal: React.FC<CodeEntryModalProps> = ({ isOpen, onClose, onSubmit, error, clearError }) => {
    const [code, setCode] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleSubmit = () => {
        onSubmit(code);
    };

    const handleClose = () => {
        setCode('');
        clearError();
        onClose();
    };

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const numericValue = e.target.value.replace(/[^0-9]/g, '');
        setCode(numericValue);
        if (error) {
            clearError();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="code-title">
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 max-w-sm w-full text-left">
                <h3 id="code-title" className="text-2xl font-bold text-stone-800">Acceso de Administrador</h3>
                <p className="text-stone-600 mt-2">Introduce el código para ver todas las citas.</p>
                <div className="mt-4">
                    <label htmlFor="adminCode" className="block text-sm font-medium text-stone-700">Código de Acceso</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <KeyIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            ref={inputRef}
                            type="password"
                            id="adminCode"
                            value={code}
                            onChange={handleCodeChange}
                            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                            className={`block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 focus:border-blue-500 focus:ring-blue-500 ${error ? 'border-red-500 text-red-600' : 'text-stone-900'}`}
                            placeholder="******"
                            aria-label="Código de acceso de administrador"
                            maxLength={6}
                        />
                    </div>
                    {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}
                </div>
                <div className="mt-6 flex flex-col sm:flex-row-reverse gap-3">
                    <button
                        onClick={handleSubmit}
                        className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Acceder
                    </button>
                    <button
                        onClick={handleClose}
                        className="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

interface ManageAppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    onFindAppointment: (phone: string) => { appointment: Appointment; dateKey: string } | null;
    onConfirmCancel: (dateKey: string, appointment: Appointment) => void;
    onChangeAppointment: (dateKey: string, appointment: Appointment) => void;
}

const ManageAppointmentModal: React.FC<ManageAppointmentModalProps> = ({
    isOpen,
    onClose,
    title,
    onFindAppointment,
    onConfirmCancel,
    onChangeAppointment,
}) => {
    const [view, setView] = useState<'lookup' | 'details' | 'cancelled'>('lookup');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [foundDetails, setFoundDetails] = useState<{ appointment: Appointment; dateKey: string } | null>(null);

    const handleFind = () => {
        setError('');
        if (!phone.trim()) {
            setError('Por favor, introduce un número de teléfono.');
            return;
        }
        const result = onFindAppointment(phone.trim());
        if (result) {
            setFoundDetails(result);
            setView('details');
        } else {
            setError('No se encontró ninguna cita próxima con ese número de teléfono. Verifica el número e inténtalo de nuevo.');
        }
    };

    const handleConfirmCancel = () => {
        if (foundDetails) {
            onConfirmCancel(foundDetails.dateKey, foundDetails.appointment);
            setView('cancelled');
        }
    };

    const handleChangeAppointment = () => {
        if (foundDetails) {
            onChangeAppointment(foundDetails.dateKey, foundDetails.appointment);
            handleClose();
        }
    };

    const handleClose = () => {
        setPhone('');
        setError('');
        setFoundDetails(null);
        setView('lookup');
        onClose();
    };

    useEffect(() => {
        if (!isOpen) {
            // Reset state when modal is closed externally
            setTimeout(() => {
                setPhone('');
                setError('');
                setFoundDetails(null);
                setView('lookup');
            }, 300); // Delay to allow for closing animation
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="manage-title">
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 max-w-md w-full text-left">
                {view === 'lookup' && (
                    <div>
                        <h3 id="manage-title" className="text-2xl font-bold text-stone-800">{title}</h3>
                        <p className="text-stone-600 mt-2">Introduce el número de teléfono que usaste para reservar.</p>
                        <div className="mt-4">
                            <label htmlFor="managePhone" className="block text-sm font-medium text-stone-700">Número de teléfono</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="tel"
                                    id="managePhone"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleFind()}
                                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2"
                                    placeholder="600 123 456"
                                />
                            </div>
                            {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}
                        </div>
                        <div className="mt-6 flex flex-col sm:flex-row-reverse gap-3">
                            <button onClick={handleFind} className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700">
                                Buscar Cita
                            </button>
                            <button onClick={handleClose} className="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50">
                                Volver
                            </button>
                        </div>
                    </div>
                )}
                {view === 'details' && foundDetails && (
                     <div>
                        <h3 id="manage-title" className="text-2xl font-bold text-stone-800">Tu Próxima Cita</h3>
                        <p className="text-stone-600 mt-2">Aquí están los detalles de tu reserva. ¿Qué te gustaría hacer?</p>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4 text-stone-800 space-y-2">
                            <p><strong className="font-semibold w-20 inline-block">Cliente:</strong> {foundDetails.appointment.customerName}</p>
                            <p><strong className="font-semibold w-20 inline-block">Fecha:</strong> {formatDisplayDate(parseDateKey(foundDetails.dateKey))}</p>
                            <p><strong className="font-semibold w-20 inline-block">Hora:</strong> {foundDetails.appointment.time}</p>
                            <p><strong className="font-semibold w-20 inline-block">Barbero:</strong> {foundDetails.appointment.barber}</p>
                             <p><strong className="font-semibold w-20 inline-block">Servicio:</strong> {foundDetails.appointment.service}</p>
                        </div>
                        <div className="mt-6 flex flex-col gap-3">
                             <button onClick={handleChangeAppointment} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700">
                                Cambiar Horario
                            </button>
                            <button onClick={handleConfirmCancel} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700">
                                Cancelar Definitivamente
                            </button>
                             <button onClick={handleClose} className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50">
                                Cerrar
                            </button>
                        </div>
                    </div>
                )}
                 {view === 'cancelled' && (
                    <div>
                        <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto" />
                        <h3 id="manage-title" className="text-2xl font-bold text-stone-800 mt-4 text-center">¡Cita Cancelada!</h3>
                        <p className="text-stone-600 mt-2 text-center">Tu cita ha sido cancelada con éxito.</p>
                        <button onClick={handleClose} className="mt-6 w-full bg-stone-800 text-white font-bold py-2 px-4 rounded-lg hover:bg-stone-900 transition-colors duration-200">
                            Cerrar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};


interface AdminCancelConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    appointment: Appointment | null;
    dateKey: string | null;
}

const AdminCancelConfirmationModal: React.FC<AdminCancelConfirmationModalProps> = ({ isOpen, onClose, onConfirm, appointment, dateKey }) => {
    if (!isOpen || !appointment || !dateKey) return null;

    const displayDate = formatDisplayDate(parseDateKey(dateKey));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4" role="dialog" aria-modal="true" aria-labelledby="admin-cancel-title">
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 max-w-md w-full text-left">
                <h3 id="admin-cancel-title" className="text-2xl font-bold text-stone-800">Confirmar Cancelación</h3>
                <p className="text-stone-600 mt-2">¿Estás seguro de que quieres cancelar la siguiente cita? Esta acción no se puede deshacer.</p>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4 text-stone-800">
                    <p><strong className="font-semibold">Cliente:</strong> {appointment.customerName}</p>
                    <p><strong className="font-semibold">Fecha:</strong> {displayDate}</p>
                    <p><strong className="font-semibold">Hora:</strong> {appointment.time}</p>
                    <p><strong className="font-semibold">Barbero:</strong> {appointment.barber}</p>
                    <p><strong className="font-semibold">Servicio:</strong> {appointment.service}</p>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row-reverse gap-3">
                    <button
                        onClick={onConfirm}
                        className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                        Sí, Cancelar Cita
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Volver
                    </button>
                </div>
            </div>
        </div>
    );
};

interface DeleteCustomerConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    customer: Customer | null;
}

const DeleteCustomerConfirmationModal: React.FC<DeleteCustomerConfirmationModalProps> = ({ isOpen, onClose, onConfirm, customer }) => {
    if (!isOpen || !customer) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4" role="dialog" aria-modal="true" aria-labelledby="delete-customer-title">
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 max-w-md w-full text-left">
                <h3 id="delete-customer-title" className="text-2xl font-bold text-stone-800">Eliminar Cliente</h3>
                <p className="text-stone-600 mt-2">¿Estás seguro de que quieres eliminar a <strong className="font-semibold">{customer.name}</strong>? Esta acción no se puede deshacer y se borrará su registro permanentemente.</p>
                
                <div className="mt-6 flex flex-col sm:flex-row-reverse gap-3">
                    <button onClick={onConfirm} className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                        Sí, Eliminar
                    </button>
                    <button onClick={onClose} className="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};


interface CustomDatePickerProps {
    selectedDate: Date;
    onDateChange: (date: Date) => void;
    minDate: Date;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ selectedDate, onDateChange, minDate }) => {
    const [day, setDay] = useState(selectedDate.getDate());
    const [month, setMonth] = useState(selectedDate.getMonth());
    const [year, setYear] = useState(selectedDate.getFullYear());

    useEffect(() => {
        setDay(selectedDate.getDate());
        setMonth(selectedDate.getMonth());
        setYear(selectedDate.getFullYear());
    }, [selectedDate]);

    const handleChange = (part: 'day' | 'month' | 'year', value: number) => {
        let newDay = day;
        let newMonth = month;
        let newYear = year;

        if (part === 'day') newDay = value;
        if (part === 'month') newMonth = value;
        if (part === 'year') newYear = value;

        // Adjust day if it's invalid for the new month/year
        const daysInMonth = new Date(newYear, newMonth + 1, 0).getDate();
        if (newDay > daysInMonth) {
            newDay = daysInMonth;
        }

        let newDate = new Date(newYear, newMonth, newDay);

        if (newDate < minDate) {
            newDate = minDate;
        }
        
        onDateChange(newDate);
    };

    const SPANISH_MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const availableYears = [new Date().getFullYear(), new Date().getFullYear() + 1];
    
    const daysInSelectedMonth = new Date(year, month + 1, 0).getDate();
    const dayOptions = Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1);

    const minYear = minDate.getFullYear();
    const minMonth = minDate.getMonth();
    const minDay = minDate.getDate();
    
    const isMinYear = year === minYear;
    const isMinMonth = isMinYear && month === minMonth;

    return (
        <div className="grid grid-cols-3 gap-2 mt-2">
            <select
                value={day}
                onChange={(e) => handleChange('day', parseInt(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                aria-label="Seleccionar día"
            >
                {dayOptions.map(d => (
                    <option key={d} value={d} disabled={isMinMonth && d < minDay}>
                        {d}
                    </option>
                ))}
            </select>
            <select
                value={month}
                onChange={(e) => handleChange('month', parseInt(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                aria-label="Seleccionar mes"
            >
                {SPANISH_MONTHS.map((m, i) => (
                    <option key={m} value={i} disabled={isMinYear && i < minMonth}>
                        {m}
                    </option>
                ))}
            </select>
            <select
                value={year}
                onChange={(e) => handleChange('year', parseInt(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                aria-label="Seleccionar año"
            >
                {availableYears.map(y => (
                    <option key={y} value={y} disabled={y < minYear}>
                        {y}
                    </option>
                ))}
            </select>
        </div>
    );
};


// --- MAIN APP COMPONENT ---
export default function App() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedSlot, setSelectedSlot] = useState<{ time: string; barber: 'Ismail' | 'Abdo' } | null>(null);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [formError, setFormError] = useState('');
    const [bookedAppointments, setBookedAppointments] = useState<BookedAppointments>(getInitialBookedAppointments);
    const [customers, setCustomers] = useState<Customer[]>(getInitialCustomers);
    const [visitHistory, setVisitHistory] = useState<VisitRecord[]>(getInitialVisitHistory);
    const [missedAppointments, setMissedAppointments] = useState<MissedAppointmentRecord[]>(getInitialMissedAppointments);
    const [lastBooked, setLastBooked] = useState<Appointment | null>(null);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [manageModalTitle, setManageModalTitle] = useState('');
    const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
    const [codeError, setCodeError] = useState('');
    const [adminCancelTarget, setAdminCancelTarget] = useState<{ dateKey: string, appointment: Appointment } | null>(null);
    const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
    const [appointmentToModify, setAppointmentToModify] = useState<{ dateKey: string, appointment: Appointment } | null>(null);


    const formRef = useRef<HTMLDivElement>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const datePickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        try {
            window.localStorage.setItem('bookedAppointments', JSON.stringify(bookedAppointments));
        } catch (error) {
            console.error('Error saving appointments to localStorage:', error);
        }
    }, [bookedAppointments]);

    useEffect(() => {
        try {
            window.localStorage.setItem('barbershopCustomers', JSON.stringify(customers));
        } catch (error) {
            console.error('Error saving customers to localStorage:', error);
        }
    }, [customers]);

    useEffect(() => {
        try {
            window.localStorage.setItem('visitHistory', JSON.stringify(visitHistory));
        } catch (error) {
            console.error('Error saving visit history to localStorage:', error);
        }
    }, [visitHistory]);

    useEffect(() => {
        try {
            window.localStorage.setItem('missedAppointments', JSON.stringify(missedAppointments));
        } catch (error) {
            console.error('Error saving missed appointments to localStorage:', error);
        }
    }, [missedAppointments]);


    useEffect(() => {
        if (selectedSlot) {
            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            const timer = setTimeout(() => {
                nameInputRef.current?.focus();
            }, 300); // Small delay to ensure the element is visible and focusable

            return () => clearTimeout(timer);
        }
    }, [selectedSlot]);
    
    const isSunday = selectedDate.getDay() === 0;
    const dateKey = useMemo(() => formatDateKey(selectedDate), [selectedDate]);
    
    const appointmentsForSelectedDate = useMemo(() => {
        return bookedAppointments[dateKey] || [];
    }, [bookedAppointments, dateKey]);
    
    const timeSlots = useMemo(() => {
        return generateTimeSlots(selectedDate, appointmentsForSelectedDate);
    }, [selectedDate, appointmentsForSelectedDate]);

    const handleDateChange = (date: Date) => {
        setSelectedDate(date);
        setSelectedSlot(null);
        if (!appointmentToModify) {
            setCustomerName('');
            setCustomerPhone('');
            setSelectedService(null);
        }
        setFormError('');
    };
    
    const handleSlotSelect = (time: string, barber: 'Ismail' | 'Abdo') => {
        setSelectedSlot({ time, barber });
        setFormError('');
    };
    
    const handleBooking = useCallback(async () => {
        if (!customerName.trim() || !customerPhone.trim() || !selectedService) {
            setFormError('Por favor, completa todos los campos y selecciona un servicio.');
            return;
        }
        
        if (selectedSlot) {
            const newAppointment: Appointment = {
                time: selectedSlot.time,
                barber: selectedSlot.barber,
                customerName: customerName.trim(),
                customerPhone: customerPhone.trim(),
                service: selectedService,
            };
            
            setBookedAppointments(prev => {
                const newBooked = { ...prev };

                // If modifying, remove the old appointment first
                if (appointmentToModify) {
                    const { dateKey: oldDateKey, appointment: oldAppointment } = appointmentToModify;
                    const oldApps = newBooked[oldDateKey] || [];
                    const updatedOldApps = oldApps.filter(
                        app => !(app.time === oldAppointment.time && app.customerPhone === oldAppointment.customerPhone && app.barber === oldAppointment.barber)
                    );
                    if (updatedOldApps.length > 0) {
                        newBooked[oldDateKey] = updatedOldApps;
                    } else {
                        delete newBooked[oldDateKey];
                    }
                }

                // Add the new appointment
                const currentAppsOnNewDate = newBooked[dateKey] || [];
                newBooked[dateKey] = [...currentAppsOnNewDate, newAppointment];
                
                return newBooked;
            });

            // Reset modification state if it was active
            if (appointmentToModify) {
                setAppointmentToModify(null);
            }

            // Add to customer archive if not already present
            setCustomers(prevCustomers => {
                const customerExists = prevCustomers.some(c => c.phone === newAppointment.customerPhone);
                if (!customerExists) {
                    const newCustomerList = [...prevCustomers, { name: newAppointment.customerName, phone: newAppointment.customerPhone, visitCount: 0, noShowCount: 0 }];
                    return newCustomerList.sort((a,b) => a.name.localeCompare(b.name));
                }
                return prevCustomers;
            });
            
            setLastBooked(newAppointment);
            setIsConfirmed(true);

            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
                const sendSmsFunctionDeclaration: FunctionDeclaration = {
                    name: 'enviar_sms',
                    description: 'Envía un mensaje de texto SMS al cliente para confirmar su cita.',
                    parameters: {
                        type: Type.OBJECT,
                        properties: {
                            phoneNumber: {
                                type: Type.STRING,
                                description: 'El número de teléfono del destinatario en formato internacional para España (ej. +34600123456).',
                            },
                            message: {
                                type: Type.STRING,
                                description: 'El contenido del mensaje de texto a enviar.',
                            },
                        },
                        required: ['phoneNumber', 'message'],
                    },
                };
    
                const displayDate = formatDisplayDate(selectedDate);
                const prompt = `Se ha reservado una nueva cita. Envía un SMS de confirmación al cliente al número de teléfono '${newAppointment.customerPhone}'. El mensaje debe ser amigable, en español, incluir todos los detalles de la cita, y recordar al cliente que llame al 614229897 para cancelar si es necesario. Asegúrate de formatear el número de teléfono al formato internacional para España (prefijo +34).

Detalles de la cita:
- Nombre: ${newAppointment.customerName}
- Teléfono: ${newAppointment.customerPhone}
- Fecha: ${displayDate}
- Hora: ${newAppointment.time}
- Barbero: ${newAppointment.barber}
- Servicio: ${newAppointment.service}`;
                
                const response: GenerateContentResponse = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                    config: {
                        tools: [{ functionDeclarations: [sendSmsFunctionDeclaration] }],
                    },
                });
    
                // Fix: The `functionCalls` property may be undefined or empty.
                // Check if it's an array with items before iterating.
                const functionCalls = response.functionCalls;
                if (Array.isArray(functionCalls) && functionCalls.length > 0) {
                    for (const functionCall of functionCalls) {
                        if (functionCall.name === 'enviar_sms') {
                            console.log('--- SIMULANDO ENVÍO DE SMS ---');
                            console.log(`Para: ${functionCall.args.phoneNumber}`);
                            console.log(`Mensaje: ${functionCall.args.message}`);
                            console.log('-----------------------------');
                        }
                    }
                } else {
                     console.log("Gemini no devolvió una llamada a función para notificaciones. Respuesta de texto:", response.text);
                }
    
            } catch (error) {
                console.error("Error al enviar notificaciones via Gemini:", error);
            }
        }
    }, [customerName, customerPhone, selectedSlot, dateKey, bookedAppointments, selectedDate, selectedService, appointmentToModify]);

    const resetBookingProcess = () => {
        setSelectedSlot(null);
        setCustomerName('');
        setCustomerPhone('');
        setFormError('');
        setSelectedService(null);
        setLastBooked(null);
        setIsConfirmed(false);
        setAppointmentToModify(null);
    };

    const findAppointmentByPhone = useCallback((phone: string): { appointment: Appointment; dateKey: string } | null => {
        const today = new Date();
        today.setHours(0,0,0,0);
        const todayKey = formatDateKey(today);

        const allUpcomingAppointments: { appointment: Appointment; dateKey: string }[] = [];

        Object.entries(bookedAppointments).forEach(([dateKey, appointments]) => {
            if (dateKey >= todayKey) {
                appointments.forEach(app => {
                    if (app.customerPhone === phone) {
                        allUpcomingAppointments.push({ appointment: app, dateKey });
                    }
                });
            }
        });

        if (allUpcomingAppointments.length === 0) {
            return null;
        }

        // Sort by date and then by time to find the very next appointment
        allUpcomingAppointments.sort((a, b) => {
            const dateComparison = a.dateKey.localeCompare(b.dateKey);
            if (dateComparison !== 0) return dateComparison;
            return a.appointment.time.localeCompare(b.appointment.time);
        });

        return allUpcomingAppointments[0];
    }, [bookedAppointments]);

    const handleConfirmCancelation = useCallback((dateKey: string, appointment: Appointment) => {
        setBookedAppointments(prev => {
            const newBooked = { ...prev };
            const appointmentsForDay = (newBooked[dateKey] || []).filter(
                app => !(app.time === appointment.time && app.customerPhone === appointment.customerPhone && app.barber === appointment.barber)
            );

            if (appointmentsForDay.length > 0) {
                newBooked[dateKey] = appointmentsForDay;
            } else {
                delete newBooked[dateKey];
            }
            return newBooked;
        });
    }, []);

    const handleChangeAppointment = useCallback((dateKey: string, appointment: Appointment) => {
        setAppointmentToModify({ dateKey, appointment });
        setCustomerName(appointment.customerName);
        setCustomerPhone(appointment.customerPhone);
        setSelectedService(appointment.service);
        setSelectedSlot(null);
        
        // Scroll to the top/date picker to prompt for a new date/time
        setTimeout(() => {
             datePickerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);

    }, []);

    const handleCodeSubmit = (code: string) => {
        if (code === '311995') {
            setIsCodeModalOpen(false);
            setIsAdminModalOpen(true);
            setCodeError('');
        } else {
            setCodeError('Código incorrecto. Inténtalo de nuevo.');
        }
    };

    const handleAdminRequestCancel = (dateKey: string, appointment: Appointment) => {
        setAdminCancelTarget({ dateKey, appointment });
    };

    const handleAdminConfirmCancel = () => {
        if (!adminCancelTarget) return;
        handleConfirmCancelation(adminCancelTarget.dateKey, adminCancelTarget.appointment);
        setAdminCancelTarget(null);
    };
    
    const handleAdminCancelClose = () => {
        setAdminCancelTarget(null);
    };

    const handleConfirmAttendance = (dateKey: string, appointmentToConfirm: Appointment) => {
        const newVisit: VisitRecord = {
            ...appointmentToConfirm,
            date: dateKey,
        };
        setVisitHistory(prevHistory => [...prevHistory, newVisit].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.time.localeCompare(a.time)));
        setCustomers(prevCustomers => {
            const customerIndex = prevCustomers.findIndex(c => c.phone === appointmentToConfirm.customerPhone);
            const updatedCustomers = [...prevCustomers];
            if (customerIndex > -1) {
                const customer = { ...updatedCustomers[customerIndex] };
                customer.visitCount = (customer.visitCount || 0) + 1;
                customer.lastVisit = dateKey;
                updatedCustomers[customerIndex] = customer;
            } else {
                 updatedCustomers.push({
                    name: appointmentToConfirm.customerName,
                    phone: appointmentToConfirm.customerPhone,
                    visitCount: 1,
                    lastVisit: dateKey,
                });
            }
            return updatedCustomers.sort((a,b) => a.name.localeCompare(b.name));
        });
        
        handleConfirmCancelation(dateKey, appointmentToConfirm);
    };

    const handleNoShow = (dateKey: string, appointmentToMark: Appointment) => {
        const newMissedRecord: MissedAppointmentRecord = {
            ...appointmentToMark,
            date: dateKey,
        };
        setMissedAppointments(prev => [...prev, newMissedRecord].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.time.localeCompare(a.time)));

        setCustomers(prevCustomers => {
            const customerIndex = prevCustomers.findIndex(c => c.phone === appointmentToMark.customerPhone);
            const updatedCustomers = [...prevCustomers];
            if (customerIndex > -1) {
                const customer = { ...updatedCustomers[customerIndex] };
                customer.noShowCount = (customer.noShowCount || 0) + 1;
                updatedCustomers[customerIndex] = customer;
            } else {
                 updatedCustomers.push({
                    name: appointmentToMark.customerName,
                    phone: appointmentToMark.customerPhone,
                    noShowCount: 1,
                });
            }
            return updatedCustomers.sort((a,b) => a.name.localeCompare(b.name));
        });

        handleConfirmCancelation(dateKey, appointmentToMark);
    };

    const handleDeleteCustomerRequest = (customer: Customer) => {
        setCustomerToDelete(customer);
    };

    const handleDeleteCustomerConfirm = () => {
        if (!customerToDelete) return;
        setCustomers(prevCustomers => prevCustomers.filter(c => c.phone !== customerToDelete.phone));
        setCustomerToDelete(null);
    };
    
    const openManageModal = (title: string) => {
        setManageModalTitle(title);
        setIsManageModalOpen(true);
    }

    const minDate = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    }, []);

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <Header />
            <main className="flex-grow container mx-auto p-4 sm:p-6">
                <div className="max-w-xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="p-6">
                        {appointmentToModify && (
                             <div className="mb-6 bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-lg" role="alert">
                                <p className="font-bold">Modo de cambio de cita</p>
                                <p>Estás cambiando tu cita del {formatDisplayDate(parseDateKey(appointmentToModify.dateKey))} a las {appointmentToModify.appointment.time}. Por favor, selecciona un nuevo horario.</p>
                            </div>
                        )}
                        {/* Step 1: Date Selection */}
                        <div ref={datePickerRef} className="mb-6">
                            <h2 className="text-xl font-bold text-stone-800 flex items-center">
                                <CalendarIcon className="h-6 w-6 mr-2 text-blue-600" />
                                1. Selecciona una Fecha
                            </h2>
                            <CustomDatePicker
                                selectedDate={selectedDate}
                                onDateChange={handleDateChange}
                                minDate={minDate}
                            />
                        </div>

                        {/* Step 2: Time & Barber Selection */}
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-stone-800 flex items-center">
                                <ClockIcon className="h-6 w-6 mr-2 text-blue-600" />
                                2. Elige Hora y Barbero
                            </h2>
                            <p className="text-stone-600 text-sm mt-1 mb-3">{formatDisplayDate(selectedDate)}</p>
                            {isSunday ? (
                                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-lg" role="alert">
                                    <p className="font-bold">Día de descanso</p>
                                    <p>La barbería está cerrada los domingos. Por favor, elige otro día.</p>
                                </div>
                            ) : timeSlots.some(s => s.isAvailableIsmail || s.isAvailableAbdo) ? (
                                <TimeSlotGrid slots={timeSlots} selectedSlot={selectedSlot} onSelectSlot={handleSlotSelect} />
                            ) : (
                                <div className="bg-gray-100 p-4 rounded-lg text-center text-stone-600">
                                    No hay citas disponibles para este día.
                                </div>
                            )}
                        </div>

                        {/* Step 3: Customer Info & Booking */}
                        {selectedSlot && !isSunday && (
                            <div ref={formRef} className="border-t border-gray-200 pt-6">
                                <h2 className="text-xl font-bold text-stone-800 flex items-center">
                                    <UserIcon className="h-6 w-6 mr-2 text-blue-600" />
                                    3. Tus Datos
                                </h2>
                                <p className="text-stone-600 text-sm mt-1">
                                    Estás reservando para las <span className="font-bold">{selectedSlot.time}</span> con <span className="font-bold">{selectedSlot.barber}</span>.
                                </p>
                                <BookingForm
                                    customerName={customerName}
                                    setCustomerName={setCustomerName}
                                    customerPhone={customerPhone}
                                    setCustomerPhone={setCustomerPhone}
                                    onSubmit={handleBooking}
                                    error={formError}
                                    nameInputRef={nameInputRef}
                                    selectedService={selectedService}
                                    onSelectService={setSelectedService}
                                    isModification={!!appointmentToModify}
                                />
                            </div>
                        )}
                    </div>
                </div>
                <div className="max-w-xl mx-auto mt-8 text-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <button
                      onClick={() => openManageModal('Cancelar o Cambiar Cita')}
                      className="inline-block w-auto text-lg font-semibold text-red-700 bg-transparent border-2 border-red-600 rounded-lg px-6 py-3 transition-colors duration-300 ease-in-out hover:bg-red-600 hover:text-white"
                  >
                      Cancelar o Cambiar Cita
                  </button>
                   <button
                      onClick={() => openManageModal('¿Olvidaste tu Cita?')}
                      className="inline-block w-auto text-lg font-semibold text-blue-700 bg-transparent border-2 border-blue-600 rounded-lg px-6 py-3 transition-colors duration-300 ease-in-out hover:bg-blue-600 hover:text-white"
                  >
                      He Olvidado mi Cita
                  </button>
                </div>
            </main>
            <footer className="text-center py-4 text-sm text-stone-500">
                <p>&copy; {new Date().getFullYear()} Barbershop-Abde. Todos los derechos reservados.</p>
                <button
                    onClick={() => setIsCodeModalOpen(true)}
                    className="mt-2 text-xs text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 rounded px-2 py-1"
                    aria-label="Acceso de administrador"
                >
                    Administrador
                </button>
            </footer>
            
            <ConfirmationModal
                isOpen={isConfirmed}
                onClose={resetBookingProcess}
                appointment={lastBooked}
                date={selectedDate}
            />

            <ManageAppointmentModal
                isOpen={isManageModalOpen}
                onClose={() => setIsManageModalOpen(false)}
                title={manageModalTitle}
                onFindAppointment={findAppointmentByPhone}
                onConfirmCancel={handleConfirmCancelation}
                onChangeAppointment={handleChangeAppointment}
            />

            <CodeEntryModal
                isOpen={isCodeModalOpen}
                onClose={() => setIsCodeModalOpen(false)}
                onSubmit={handleCodeSubmit}
                error={codeError}
                clearError={() => setCodeError('')}
            />

            <AdminModal
                isOpen={isAdminModalOpen}
                onClose={() => setIsAdminModalOpen(false)}
                appointments={bookedAppointments}
                customers={customers}
                visitHistory={visitHistory}
                onCancelAppointment={handleAdminRequestCancel}
                onConfirmAttendance={handleConfirmAttendance}
                onNoShow={handleNoShow}
                onDeleteCustomer={handleDeleteCustomerRequest}
            />

            <AdminCancelConfirmationModal
                isOpen={!!adminCancelTarget}
                onClose={handleAdminCancelClose}
                onConfirm={handleAdminConfirmCancel}
                appointment={adminCancelTarget?.appointment || null}
                dateKey={adminCancelTarget?.dateKey || null}
            />
            
            <DeleteCustomerConfirmationModal
                isOpen={!!customerToDelete}
                onClose={() => setCustomerToDelete(null)}
                onConfirm={handleDeleteCustomerConfirm}
                customer={customerToDelete}
            />
        </div>
    );
}