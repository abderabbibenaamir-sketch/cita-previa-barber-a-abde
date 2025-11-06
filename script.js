document.addEventListener('DOMContentLoaded', () => {
    // Check for @google/genai
    if (!window.GoogleGenAI) {
        console.error('GoogleGenAI SDK not loaded.');
        document.getElementById('root').innerHTML = `<div class="text-red-500 text-center p-8">Error: No se pudo cargar el SDK de Google GenAI.</div>`;
        return;
    }
    
    const { GoogleGenAI, FunctionDeclaration, Type } = window.GoogleGenAI;

    // --- STATE MANAGEMENT ---
    let state = {
        selectedDate: new Date(),
        selectedSlot: null,
        customerName: '',
        customerPhone: '',
        formError: '',
        bookedAppointments: getInitialBookedAppointments(),
        customers: getInitialCustomers(),
        lastBooked: null,
        isConfirmed: false,
        isAdminModalOpen: false,
        isCancelModalOpen: false,
        isCodeModalOpen: false,
        codeError: '',
        adminCancelTarget: null,
        isAdminCancelConfirmationOpen: false,
    };

    // --- ICONS ---
    const CalendarIcon = (className) => `<svg xmlns="http://www.w3.org/2000/svg" class="${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>`;
    const ClockIcon = (className) => `<svg xmlns="http://www.w3.org/2000/svg" class="${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
    const UserIcon = (className) => `<svg xmlns="http://www.w3.org/2000/svg" class="${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>`;
    const PhoneIcon = (className) => `<svg xmlns="http://www.w3.org/2000/svg" class="${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>`;
    const CheckCircleIcon = (className) => `<svg xmlns="http://www.w3.org/2000/svg" class="${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
    const TrashIcon = (className) => `<svg xmlns="http://www.w3.org/2000/svg" class="${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>`;
    const KeyIcon = (className) => `<svg xmlns="http://www.w3.org/2000/svg" class="${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7h2a2 2 0 012 2v4a2 2 0 01-2 2h-2m-6 4H7a2 2 0 01-2-2v-4a2 2 0 012-2h2.5" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 12V9a2.98 2.98 0 012-2.828M12 12v3m0-3h-2m2 0h2" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a1 1 0 11-2 0 1 1 0 012 0z" /></svg>`;
    const SearchIcon = (className) => `<svg xmlns="http://www.w3.org/2000/svg" class="${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>`;
    const ClipboardCopyIcon = (className) => `<svg xmlns="http://www.w3.org/2000/svg" class="${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>`;

    // --- UTILS ---
    const formatDateKey = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const parseDateKey = (dateKey) => {
        const [year, month, day] = dateKey.split('-').map(Number);
        return new Date(year, month - 1, day);
    };
    const formatDisplayDate = (date) => {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = new Intl.DateTimeFormat('es-ES', options).format(date);
        return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
    };
    const generateTimeSlots = (date, bookedAppointmentsForDay) => {
        if (date.getDay() === 0) return [];
        const allSlots = [];
        for (let h = 10; h < 14; h++) {
            allSlots.push(`${String(h).padStart(2, '0')}:00`);
            allSlots.push(`${String(h).padStart(2, '0')}:30`);
        }
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
            const isBookedForIsmail = bookedAppointmentsForDay.some(app => app.time === time && app.barber === 'Ismail');
            const isBookedForAbdo = bookedAppointmentsForDay.some(app => app.time === time && app.barber === 'Abdo');
            return { time, isAvailableIsmail: !isPast && !isBookedForIsmail, isAvailableAbdo: !isPast && !isBookedForAbdo };
        });
    };

    // --- DATA HELPERS ---
    function getInitialBookedAppointments() {
        try {
            const item = window.localStorage.getItem('bookedAppointments');
            return item ? JSON.parse(item) : generateDefaultAppointments();
        } catch (error) {
            console.error("Error reading appointments from localStorage", error);
            return generateDefaultAppointments();
        }
    }

    function generateDefaultAppointments() {
        const todayKey = formatDateKey(new Date());
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowKey = formatDateKey(tomorrow);
        return {
            [todayKey]: [
                { time: '11:00', customerName: 'Juan Pérez', customerPhone: '555123456', barber: 'Ismail' },
                { time: '11:00', customerName: 'Pedro Gómez', customerPhone: '555112233', barber: 'Abdo' },
                { time: '17:30', customerName: 'Maria García', customerPhone: '555654321', barber: 'Ismail' },
            ],
            [tomorrowKey]: [
                { time: '10:00', customerName: 'Carlos Sánchez', customerPhone: '555987654', barber: 'Abdo' },
            ]
        };
    }

    function getInitialCustomers() {
        try {
            const item = window.localStorage.getItem('barbershopCustomers');
            return item ? JSON.parse(item) : [];
        } catch (error) {
            console.error("Error reading customers from localStorage", error);
            return [];
        }
    }

    function saveStateToLocalStorage() {
        try {
            window.localStorage.setItem('bookedAppointments', JSON.stringify(state.bookedAppointments));
            window.localStorage.setItem('barbershopCustomers', JSON.stringify(state.customers));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    // --- RENDER FUNCTIONS (COMPONENTS) ---
    function renderApp() {
        const root = document.getElementById('root');
        const { selectedDate, selectedSlot, customerName, customerPhone, formError } = state;

        const isSunday = selectedDate.getDay() === 0;
        const dateKey = formatDateKey(selectedDate);
        const appointmentsForSelectedDate = state.bookedAppointments[dateKey] || [];
        const timeSlots = generateTimeSlots(selectedDate, appointmentsForSelectedDate);

        const appHTML = `
            <div class="min-h-screen bg-gray-100 flex flex-col">
                <header class="bg-stone-900 text-white shadow-lg">
                    <div class="container mx-auto px-4 py-4 text-center">
                        <h1 class="text-4xl font-bold tracking-wider">Barbershop-Abde</h1>
                        <p class="text-stone-300 mt-1">Tu estilo, nuestra pasión.</p>
                        <a href="tel:614229897" class="mt-3 inline-flex items-center text-green-400 text-2xl font-bold hover:text-green-300 transition-colors duration-200">
                            ${PhoneIcon('h-6 w-6 mr-2')}
                            614 229 897
                        </a>
                    </div>
                </header>
                <main class="flex-grow container mx-auto p-4 sm:p-6">
                    <div class="max-w-xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
                        <div class="p-6">
                            <!-- Step 1: Date Selection -->
                            <div class="mb-6">
                                <h2 class="text-xl font-bold text-stone-800 flex items-center">
                                    ${CalendarIcon('h-6 w-6 mr-2 text-blue-600')}
                                    1. Selecciona una Fecha
                                </h2>
                                ${renderCustomDatePicker(selectedDate)}
                            </div>

                            <!-- Step 2: Time & Barber Selection -->
                            <div class="mb-6">
                                <h2 class="text-xl font-bold text-stone-800 flex items-center">
                                    ${ClockIcon('h-6 w-6 mr-2 text-blue-600')}
                                    2. Elige Hora y Barbero
                                </h2>
                                <p class="text-stone-600 text-sm mt-1 mb-3">${formatDisplayDate(selectedDate)}</p>
                                ${isSunday ? `
                                    <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-lg" role="alert">
                                        <p class="font-bold">Día de descanso</p>
                                        <p>La barbería está cerrada los domingos. Por favor, elige otro día.</p>
                                    </div>
                                ` : timeSlots.some(s => s.isAvailableIsmail || s.isAvailableAbdo) ? 
                                    renderTimeSlotGrid(timeSlots, selectedSlot) : `
                                    <div class="bg-gray-100 p-4 rounded-lg text-center text-stone-600">
                                        No hay citas disponibles para este día.
                                    </div>
                                `}
                            </div>

                            <!-- Step 3: Customer Info & Booking -->
                            ${selectedSlot && !isSunday ? `
                                <div id="booking-form-container" class="border-t border-gray-200 pt-6">
                                    <h2 class="text-xl font-bold text-stone-800 flex items-center">
                                        ${UserIcon('h-6 w-6 mr-2 text-blue-600')}
                                        3. Tus Datos
                                    </h2>
                                    <p class="text-stone-600 text-sm mt-1">
                                        Estás reservando para las <span class="font-bold">${selectedSlot.time}</span> con <span class="font-bold">${selectedSlot.barber}</span>.
                                    </p>
                                    ${renderBookingForm(customerName, customerPhone, formError)}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    <div class="max-w-xl mx-auto mt-8 text-center">
                      <button id="open-cancel-modal-btn" class="inline-block w-auto text-lg font-semibold text-red-700 bg-transparent border-2 border-red-600 rounded-lg px-8 py-3 transition-colors duration-300 ease-in-out hover:bg-red-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                          Cancelar una Cita
                      </button>
                    </div>
                </main>
                <footer class="text-center py-4 text-sm text-stone-500">
                    <p>&copy; ${new Date().getFullYear()} Barbershop-Abde. Todos los derechos reservados.</p>
                    <button id="open-code-modal-btn" class="mt-2 text-xs text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 rounded px-2 py-1" aria-label="Acceso de administrador">
                        Administrador
                    </button>
                </footer>
                
                ${renderConfirmationModal()}
                ${renderCancelAppointmentModal()}
                ${renderCodeEntryModal()}
                ${renderAdminModal()}
                ${renderAdminCancelConfirmationModal()}
            </div>
        `;
        root.innerHTML = appHTML;
        addEventListeners();

        if (state.selectedSlot) {
            const formContainer = document.getElementById('booking-form-container');
            if (formContainer) {
                formContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                 setTimeout(() => {
                    const nameInput = document.getElementById('customerName');
                    if (nameInput) nameInput.focus();
                }, 300);
            }
        }
    }

    function renderCustomDatePicker(selectedDate) {
        const day = selectedDate.getDate();
        const month = selectedDate.getMonth();
        const year = selectedDate.getFullYear();
        
        const SPANISH_MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const availableYears = [new Date().getFullYear(), new Date().getFullYear() + 1];
        const daysInSelectedMonth = new Date(year, month + 1, 0).getDate();
        
        const minDate = new Date();
        minDate.setHours(0, 0, 0, 0);
        const minYear = minDate.getFullYear();
        const minMonth = minDate.getMonth();
        const minDay = minDate.getDate();

        const isMinYear = year === minYear;
        const isMinMonth = isMinYear && month === minMonth;

        const dayOptions = Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1).map(d => 
            `<option value="${d}" ${d === day ? 'selected' : ''} ${isMinMonth && d < minDay ? 'disabled' : ''}>${d}</option>`
        ).join('');

        const monthOptions = SPANISH_MONTHS.map((m, i) =>
            `<option value="${i}" ${i === month ? 'selected' : ''} ${isMinYear && i < minMonth ? 'disabled' : ''}>${m}</option>`
        ).join('');

        const yearOptions = availableYears.map(y => 
            `<option value="${y}" ${y === year ? 'selected' : ''} ${y < minYear ? 'disabled' : ''}>${y}</option>`
        ).join('');

        return `
            <div class="grid grid-cols-3 gap-2 mt-2">
                <select id="day-select" class="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" aria-label="Seleccionar día">${dayOptions}</select>
                <select id="month-select" class="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" aria-label="Seleccionar mes">${monthOptions}</select>
                <select id="year-select" class="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" aria-label="Seleccionar año">${yearOptions}</select>
            </div>
        `;
    }

    function renderTimeSlotGrid(slots, selectedSlot) {
        const renderSlot = ({ time, isAvailableIsmail, isAvailableAbdo }) => `
            <div class="rounded-lg border border-gray-200 p-3 text-center transition-all duration-200 shadow-sm hover:shadow-lg bg-white">
                <p class="font-bold text-lg text-stone-800 mb-3">${time}</p>
                <div class="grid grid-cols-2 gap-2">
                    <button data-time="${time}" data-barber="Ismail" ${!isAvailableIsmail ? 'disabled' : ''} class="slot-btn p-2 w-full rounded-md text-center font-semibold transition-colors duration-200 text-xs sm:text-sm
                        ${!isAvailableIsmail ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : ''}
                        ${isAvailableIsmail && selectedSlot?.time === time && selectedSlot?.barber === 'Ismail' ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-700' : ''}
                        ${isAvailableIsmail && !(selectedSlot?.time === time && selectedSlot?.barber === 'Ismail') ? 'bg-white hover:bg-blue-100 text-blue-800 border border-blue-200' : ''}">
                        Ismail
                    </button>
                    <button data-time="${time}" data-barber="Abdo" ${!isAvailableAbdo ? 'disabled' : ''} class="slot-btn p-2 w-full rounded-md text-center font-semibold transition-colors duration-200 text-xs sm:text-sm
                        ${!isAvailableAbdo ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : ''}
                        ${isAvailableAbdo && selectedSlot?.time === time && selectedSlot?.barber === 'Abdo' ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-700' : ''}
                        ${isAvailableAbdo && !(selectedSlot?.time === time && selectedSlot?.barber === 'Abdo') ? 'bg-white hover:bg-blue-100 text-blue-800 border border-blue-200' : ''}">
                        Abdo
                    </button>
                </div>
            </div>`;

        const morningSlots = slots.filter(slot => parseInt(slot.time.split(':')[0]) < 14);
        const eveningSlots = slots.filter(slot => parseInt(slot.time.split(':')[0]) >= 16);

        return `
            <div class="mt-4">
                ${morningSlots.length > 0 ? `<div class="grid grid-cols-2 md:grid-cols-3 gap-4">${morningSlots.map(renderSlot).join('')}</div>` : ''}
                ${morningSlots.length > 0 && eveningSlots.length > 0 ? `<hr class="border-t-2 border-dashed border-gray-300 my-6" />` : ''}
                ${eveningSlots.length > 0 ? `<div class="grid grid-cols-2 md:grid-cols-3 gap-4">${eveningSlots.map(renderSlot).join('')}</div>` : ''}
            </div>
        `;
    }

    function renderBookingForm(name, phone, error) {
        return `
            <div class="space-y-4 mt-6">
                <div>
                    <label for="customerName" class="block text-sm font-medium text-stone-700">Tu Nombre</label>
                    <div class="mt-1 relative rounded-md shadow-sm">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">${UserIcon('h-5 w-5 text-gray-400')}</div>
                        <input type="text" id="customerName" value="${name}" class="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2" placeholder="Tu nombre" aria-label="Tu Nombre" />
                    </div>
                </div>
                <div>
                    <label for="customerPhone" class="block text-sm font-medium text-stone-700">Número de teléfono</label>
                    <div class="mt-1 relative rounded-md shadow-sm">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">${PhoneIcon('h-5 w-5 text-gray-400')}</div>
                        <input type="tel" id="customerPhone" value="${phone}" class="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2" placeholder="600 123 456" aria-label="Número de teléfono del cliente" />
                    </div>
                </div>
                ${error ? `<p class="text-sm text-red-600" role="alert">${error}</p>` : ''}
                <button id="confirm-booking-btn" class="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Confirmar Cita
                </button>
            </div>
        `;
    }
    
    // --- MODAL RENDERERS ---

    function renderConfirmationModal() {
        const { isConfirmed, lastBooked, selectedDate } = state;
        if (!isConfirmed || !lastBooked) return `<div id="confirmation-modal" class="modal-hidden"></div>`;

        return `
            <div id="confirmation-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
                <div class="bg-white rounded-xl shadow-2xl p-6 sm:p-8 max-w-sm w-full text-center">
                    ${CheckCircleIcon('h-16 w-16 text-green-500 mx-auto')}
                    <h3 class="text-2xl font-bold text-stone-800 mt-4">¡Cita Confirmada!</h3>
                    <p class="text-stone-600 mt-2">Gracias, ${lastBooked.customerName}.</p>
                    <div class="bg-blue-800 rounded-lg p-4 mt-6 text-left text-white">
                        <div class="space-y-2">
                            <p><strong class="text-blue-200">Fecha:</strong> ${formatDisplayDate(selectedDate)}</p>
                            <p><strong class="text-blue-200">Hora:</strong> ${lastBooked.time}</p>
                            <p><strong class="text-blue-200">Barbero:</strong> ${lastBooked.barber}</p>
                        </div>
                         <div class="border-t border-blue-700 my-3"></div>
                         <div>
                            <p><strong class="text-blue-200">Contacto del Salón:</strong> 614229897</p>
                            <p class="text-xs text-blue-100 mt-1">Si no puedes asistir a tu cita, por favor llama para cancelarla.</p>
                        </div>
                    </div>
                    <p class="text-sm text-stone-500 mt-4">Te esperamos en la barbería.</p>
                    <p class="text-xs text-stone-500 mt-2 font-semibold">Para que no olvides tu cita, por favor, toma una captura de pantalla.</p>
                    <button id="reset-booking-btn" class="mt-6 w-full bg-stone-800 text-white font-bold py-2 px-4 rounded-lg hover:bg-stone-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-700">
                        Reservar Otra Cita
                    </button>
                </div>
            </div>
        `;
    }

    function renderCodeEntryModal() {
        if (!state.isCodeModalOpen) return `<div id="code-modal" class="modal-hidden"></div>`;
        return `
             <div id="code-modal" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
                <div class="bg-white rounded-xl shadow-2xl p-6 sm:p-8 max-w-sm w-full text-left">
                    <h3 class="text-2xl font-bold text-stone-800">Acceso de Administrador</h3>
                    <p class="text-stone-600 mt-2">Introduce el código para ver todas las citas.</p>
                    <div class="mt-4">
                        <label for="adminCode" class="block text-sm font-medium text-stone-700">Código de Acceso</label>
                        <div class="mt-1 relative rounded-md shadow-sm">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">${KeyIcon('h-5 w-5 text-gray-400')}</div>
                            <input type="password" id="adminCode" class="block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 focus:border-blue-500 focus:ring-blue-500 ${state.codeError ? 'border-red-500 text-red-600' : 'text-stone-900'}" placeholder="******" maxlength="6"/>
                        </div>
                        ${state.codeError ? `<p class="mt-2 text-sm text-red-600" role="alert">${state.codeError}</p>` : ''}
                    </div>
                    <div class="mt-6 flex flex-col sm:flex-row-reverse gap-3">
                        <button id="submit-code-btn" class="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Acceder</button>
                        <button id="close-code-modal-btn" class="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Cancelar</button>
                    </div>
                </div>
            </div>
        `;
    }

    function renderCancelAppointmentModal() {
        // This modal's state is handled internally within its event handlers, so we just need to render its structure
        return `<div id="cancel-appointment-modal" class="modal-hidden fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true"></div>`;
    }
    
    function renderAdminModal() {
        return `<div id="admin-modal" class="modal-hidden fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true"></div>`;
    }

    function renderAdminCancelConfirmationModal() {
        const { isAdminCancelConfirmationOpen, adminCancelTarget } = state;
        if (!isAdminCancelConfirmationOpen || !adminCancelTarget) return `<div id="admin-cancel-confirmation-modal" class="modal-hidden"></div>`;

        const { appointment, dateKey } = adminCancelTarget;
        const displayDate = formatDisplayDate(parseDateKey(dateKey));

        return `
            <div id="admin-cancel-confirmation-modal" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4" role="dialog" aria-modal="true">
                <div class="bg-white rounded-xl shadow-2xl p-6 sm:p-8 max-w-md w-full text-left">
                    <h3 class="text-2xl font-bold text-stone-800">Confirmar Cancelación</h3>
                    <p class="text-stone-600 mt-2">¿Estás seguro de que quieres cancelar la siguiente cita? Esta acción no se puede deshacer.</p>
                    <div class="bg-red-50 border border-red-200 rounded-lg p-4 mt-4 text-stone-800">
                        <p><strong class="font-semibold">Cliente:</strong> ${appointment.customerName}</p>
                        <p><strong class="font-semibold">Fecha:</strong> ${displayDate}</p>
                        <p><strong class="font-semibold">Hora:</strong> ${appointment.time}</p>
                        <p><strong class="font-semibold">Barbero:</strong> ${appointment.barber}</p>
                    </div>
                    <div class="mt-6 flex flex-col sm:flex-row-reverse gap-3">
                        <button id="confirm-admin-cancel-btn" class="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">Sí, Cancelar Cita</button>
                        <button id="close-admin-cancel-confirm-modal-btn" class="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Volver</button>
                    </div>
                </div>
            </div>
        `;
    }


    // --- EVENT LISTENERS ---
    function addEventListeners() {
        // Date Picker
        document.getElementById('day-select')?.addEventListener('change', handleDateChange);
        document.getElementById('month-select')?.addEventListener('change', handleDateChange);
        document.getElementById('year-select')?.addEventListener('change', handleDateChange);
        
        // Time Slots
        document.querySelectorAll('.slot-btn').forEach(btn => btn.addEventListener('click', handleSlotSelect));

        // Booking Form
        document.getElementById('confirm-booking-btn')?.addEventListener('click', handleBooking);
        document.getElementById('customerName')?.addEventListener('input', (e) => state.customerName = e.target.value);
        document.getElementById('customerPhone')?.addEventListener('input', (e) => state.customerPhone = e.target.value);
        
        // Confirmation Modal
        document.getElementById('reset-booking-btn')?.addEventListener('click', resetBookingProcess);

        // Footer buttons
        document.getElementById('open-code-modal-btn').addEventListener('click', () => {
            state.isCodeModalOpen = true;
            renderApp();
            setTimeout(() => document.getElementById('adminCode')?.focus(), 100);
        });

        document.getElementById('open-cancel-modal-btn').addEventListener('click', () => {
             openCancelAppointmentModal();
        });

        // Code Modal
        document.getElementById('submit-code-btn')?.addEventListener('click', handleCodeSubmit);
        document.getElementById('close-code-modal-btn')?.addEventListener('click', () => {
            state.isCodeModalOpen = false;
            state.codeError = '';
            renderApp();
        });
        document.getElementById('adminCode')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleCodeSubmit();
        });
        
        // Admin Cancel Confirmation Modal
        document.getElementById('confirm-admin-cancel-btn')?.addEventListener('click', handleAdminConfirmCancel);
        document.getElementById('close-admin-cancel-confirm-modal-btn')?.addEventListener('click', () => {
            state.isAdminCancelConfirmationOpen = false;
            renderApp();
        });
    }

    // --- EVENT HANDLERS ---
    
    function handleDateChange() {
        const day = parseInt(document.getElementById('day-select').value);
        const month = parseInt(document.getElementById('month-select').value);
        const year = parseInt(document.getElementById('year-select').value);
        
        let newDate = new Date(year, month, day);
        const minDate = new Date();
        minDate.setHours(0,0,0,0);

        if (newDate < minDate) {
            newDate = minDate;
        }

        state.selectedDate = newDate;
        state.selectedSlot = null;
        state.customerName = '';
        state.customerPhone = '';
        state.formError = '';
        renderApp();
    }

    function handleSlotSelect(event) {
        const { time, barber } = event.currentTarget.dataset;
        state.selectedSlot = { time, barber };
        state.formError = '';
        renderApp();
    }

    async function handleBooking() {
        if (!state.customerName.trim() || !state.customerPhone.trim()) {
            state.formError = 'Por favor, completa todos los campos.';
            renderApp();
            return;
        }

        if (state.selectedSlot) {
            const newAppointment = {
                time: state.selectedSlot.time,
                barber: state.selectedSlot.barber,
                customerName: state.customerName.trim(),
                customerPhone: state.customerPhone.trim(),
            };

            const dateKey = formatDateKey(state.selectedDate);
            const updatedAppointmentsForDate = [...(state.bookedAppointments[dateKey] || []), newAppointment];

            state.bookedAppointments = { ...state.bookedAppointments, [dateKey]: updatedAppointmentsForDate };

            const customerExists = state.customers.some(c => c.phone === newAppointment.customerPhone);
            if (!customerExists) {
                state.customers.push({ name: newAppointment.customerName, phone: newAppointment.customerPhone });
                state.customers.sort((a, b) => a.name.localeCompare(b.name));
            }

            state.lastBooked = newAppointment;
            state.isConfirmed = true;
            
            saveStateToLocalStorage();
            renderApp();
            
            // Gemini API Call
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                
                 const sendSmsFunctionDeclaration = {
                    name: 'send_sms',
                    description: 'Envía un mensaje de texto SMS al cliente para confirmar su cita.',
                    parameters: { type: Type.OBJECT, properties: { phoneNumber: { type: Type.STRING }, message: { type: Type.STRING } }, required: ['phoneNumber', 'message'] }
                };
                const sendEmailFunctionDeclaration = {
                    name: 'send_email_notification',
                    description: 'Envía una notificación por correo electrónico al administrador sobre una nueva reserva de cita.',
                    parameters: { type: Type.OBJECT, properties: { recipientEmail: { type: Type.STRING }, subject: { type: Type.STRING }, body: { type: Type.STRING } }, required: ['recipientEmail', 'subject', 'body'] }
                };

                const displayDate = formatDisplayDate(state.selectedDate);
                const prompt = `Se ha reservado una nueva cita. Realiza las siguientes dos acciones:
1. Envía un SMS de confirmación al cliente al número de teléfono '${newAppointment.customerPhone}'. El mensaje debe ser amigable, en español, incluir todos los detalles de la cita, y recordar al cliente que llame al 614229897 para cancelar si es necesario. Asegúrate de formatear el número de teléfono al formato internacional para España (prefijo +34).
2. Envía una notificación por correo electrónico al administrador a 'abderabbibenaamir@gmail.com'. El asunto debe ser 'Nueva Cita Reservada'. El cuerpo del correo debe contener todos los detalles de la nueva cita de forma clara.

Detalles de la cita:
- Nombre: ${newAppointment.customerName}
- Teléfono: ${newAppointment.customerPhone}
- Fecha: ${displayDate}
- Hora: ${newAppointment.time}
- Barbero: ${newAppointment.barber}`;
                
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                    config: {
                        tools: [{ functionDeclarations: [sendSmsFunctionDeclaration, sendEmailFunctionDeclaration] }],
                    },
                });
    
                if (response.functionCalls && response.functionCalls.length > 0) {
                    for (const functionCall of response.functionCalls) {
                        console.log(`--- SIMULATING API CALL: ${functionCall.name} ---`);
                        console.log('Arguments:', functionCall.args);
                        console.log('-------------------------------------------');
                    }
                } else {
                     console.log("Gemini did not return a function call for notifications. Text response:", response.text);
                }
            } catch (error) {
                console.error("Error sending notifications via Gemini:", error);
            }
        }
    }

    function resetBookingProcess() {
        state.selectedSlot = null;
        state.customerName = '';
        state.customerPhone = '';
        state.formError = '';
        state.lastBooked = null;
        state.isConfirmed = false;
        renderApp();
    }

    function handleCodeSubmit() {
        const code = document.getElementById('adminCode').value;
        if (code === '311995') {
            state.isCodeModalOpen = false;
            state.codeError = '';
            openAdminModal();
        } else {
            state.codeError = 'Código incorrecto. Inténtalo de nuevo.';
            renderApp();
        }
    }

    function handleAdminConfirmCancel() {
        if (!state.adminCancelTarget) return;

        const { dateKey, appointment } = state.adminCancelTarget;
        const updatedAppointmentsForDate = (state.bookedAppointments[dateKey] || []).filter(
            app => !(app.time === appointment.time && app.customerPhone === appointment.customerPhone && app.barber === appointment.barber)
        );

        if (updatedAppointmentsForDate.length > 0) {
            state.bookedAppointments[dateKey] = updatedAppointmentsForDate;
        } else {
            delete state.bookedAppointments[dateKey];
        }

        state.adminCancelTarget = null;
        state.isAdminCancelConfirmationOpen = false;
        saveStateToLocalStorage();
        openAdminModal(); // Re-render admin modal with updated data
    }
    
    // --- DYNAMIC MODAL LOGIC ---
    
    function openCancelAppointmentModal() {
        const modalContainer = document.getElementById('cancel-appointment-modal');
        let phone = '';
        let error = '';
        let cancelledDetails = null;

        const renderContent = () => {
             modalContainer.innerHTML = `
                <div class="bg-white rounded-xl shadow-2xl p-6 sm:p-8 max-w-md w-full text-left">
                    ${cancelledDetails ? `
                        <div>
                            ${CheckCircleIcon('h-16 w-16 text-green-500 mx-auto')}
                            <h3 class="text-2xl font-bold text-stone-800 mt-4 text-center">¡Cita Cancelada!</h3>
                            <p class="text-stone-600 mt-2 text-center">Tu cita ha sido cancelada con éxito.</p>
                            <div class="bg-blue-800 rounded-lg p-4 mt-6 text-left text-white">
                                <p><strong class="text-blue-200">Nombre:</strong> ${cancelledDetails.appointment.customerName}</p>
                                <p><strong class="text-blue-200">Barbero:</strong> ${cancelledDetails.appointment.barber}</p>
                                <p><strong class="text-blue-200">Fecha:</strong> ${formatDisplayDate(parseDateKey(cancelledDetails.date))}</p>
                                <p><strong class="text-blue-200">Hora:</strong> ${cancelledDetails.appointment.time}</p>
                            </div>
                            <button id="close-final-cancel-btn" class="mt-6 w-full bg-stone-800 text-white font-bold py-2 px-4 rounded-lg hover:bg-stone-900 transition-colors duration-200">Cerrar</button>
                        </div>
                    ` : `
                        <div>
                            <h3 class="text-2xl font-bold text-stone-800">Cancelar Cita</h3>
                            <p class="text-stone-600 mt-2">Introduce el número de teléfono que usaste para reservar y cancelaremos tu cita.</p>
                            <div class="mt-4">
                                <label for="cancelPhone" class="block text-sm font-medium text-stone-700">Número de teléfono</label>
                                <div class="mt-1 relative rounded-md shadow-sm">
                                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">${PhoneIcon('h-5 w-5 text-gray-400')}</div>
                                    <input type="tel" id="cancelPhone" value="${phone}" class="focus:ring-red-500 focus:border-red-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2" placeholder="600 123 456" />
                                </div>
                                ${error ? `<p class="mt-2 text-sm text-red-600" role="alert">${error}</p>` : ''}
                            </div>
                            <div class="mt-6 flex flex-col sm:flex-row-reverse gap-3">
                                <button id="confirm-cancel-btn" class="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700">Confirmar Cancelación</button>
                                <button id="close-cancel-modal-btn" class="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50">Volver</button>
                            </div>
                        </div>
                    `}
                </div>
            `;
            addCancelModalListeners();
        };

        const handleConfirm = () => {
            error = '';
            if (!phone.trim()) {
                error = 'Por favor, introduce un número de teléfono.';
                renderContent();
                return;
            }
            
            let appointmentFound = null;
            let dateKeyFound = null;

            for (const dateKey in state.bookedAppointments) {
                const appointmentIndex = state.bookedAppointments[dateKey].findIndex(app => app.customerPhone === phone.trim());
                if (appointmentIndex > -1) {
                    appointmentFound = { ...state.bookedAppointments[dateKey][appointmentIndex] };
                    dateKeyFound = dateKey;
                    state.bookedAppointments[dateKey].splice(appointmentIndex, 1);
                    if (state.bookedAppointments[dateKey].length === 0) {
                        delete state.bookedAppointments[dateKey];
                    }
                    break;
                }
            }

            if (appointmentFound && dateKeyFound) {
                saveStateToLocalStorage();
                cancelledDetails = { appointment: appointmentFound, date: dateKeyFound };
                phone = '';
                renderApp(); // re-render main app to reflect change
                renderContent(); // re-render modal
            } else {
                error = 'No se encontró ninguna cita con ese número de teléfono. Verifica el número e inténtalo de nuevo.';
                renderContent();
            }
        };
        
        const close = () => {
            modalContainer.classList.add('modal-hidden');
            modalContainer.innerHTML = '';
        };

        const addCancelModalListeners = () => {
            document.getElementById('close-cancel-modal-btn')?.addEventListener('click', close);
            document.getElementById('close-final-cancel-btn')?.addEventListener('click', close);
            document.getElementById('confirm-cancel-btn')?.addEventListener('click', handleConfirm);
            const phoneInput = document.getElementById('cancelPhone');
            if(phoneInput) {
                phoneInput.addEventListener('input', (e) => phone = e.target.value);
                phoneInput.focus();
            }
        };

        modalContainer.classList.remove('modal-hidden');
        renderContent();
    }
    
    function openAdminModal() {
        const modalContainer = document.getElementById('admin-modal');
        let view = 'appointments';
        let searchTerm = '';
        let copiedPhone = null;

        const renderContent = () => {
            const sortedDates = Object.keys(state.bookedAppointments).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
            
            const filteredCustomers = searchTerm 
                ? state.customers.filter(c => 
                    c.name.toLowerCase().replace(/\s/g, '').includes(searchTerm.toLowerCase().replace(/\s/g, '')) || 
                    c.phone.replace(/\s/g, '').includes(searchTerm.replace(/\s/g, '')))
                : state.customers;

            modalContainer.innerHTML = `
                <div class="bg-white rounded-xl shadow-2xl p-6 sm:p-8 max-w-lg w-full text-left flex flex-col max-h-[90vh]">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-2xl font-bold text-stone-800">${view === 'appointments' ? 'Citas Reservadas' : 'Archivo de Clientes'}</h3>
                        <button id="close-admin-btn" class="text-gray-400 hover:text-gray-600"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>
                    <div class="border-b border-gray-200">
                        <nav class="-mb-px flex space-x-6">
                            <button data-view="appointments" class="admin-view-btn whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${view === 'appointments' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}">Citas</button>
                            <button data-view="customers" class="admin-view-btn whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${view === 'customers' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}">Clientes</button>
                        </nav>
                    </div>
                    <div class="overflow-y-auto flex-grow mt-4 pr-2">
                        ${view === 'appointments' ? `
                            ${sortedDates.filter(dateKey => state.bookedAppointments[dateKey]?.length > 0).length === 0 ? `<p class="text-stone-600 text-center py-8">No hay ninguna cita reservada.</p>` :
                            sortedDates.map(dateKey => {
                                const appointmentsForDay = state.bookedAppointments[dateKey];
                                if (!appointmentsForDay || appointmentsForDay.length === 0) return '';
                                return `
                                    <div class="mb-6">
                                        <h4 class="text-lg font-semibold text-blue-800 bg-blue-100 p-2 rounded-md mb-3 sticky top-0">${formatDisplayDate(parseDateKey(dateKey))}</h4>
                                        <ul class="space-y-3">
                                            ${appointmentsForDay.slice().sort((a, b) => a.time.localeCompare(b.time) || a.barber.localeCompare(b.barber)).map((app, index) => `
                                                <li class="bg-stone-50 p-3 rounded-lg border border-stone-200 flex items-center justify-between">
                                                    <div>
                                                        <div class="flex items-center"><span class="font-bold text-lg text-stone-800">${app.time}</span><span class="ml-3 text-sm font-semibold px-2 py-1 rounded-full bg-blue-200 text-blue-800">${app.barber}</span></div>
                                                        <div class="mt-2 text-sm text-stone-600">
                                                            <p class="flex items-center">${UserIcon('h-4 w-4 mr-2 text-stone-400')} ${app.customerName}</p>
                                                            <p class="flex items-center mt-1">${PhoneIcon('h-4 w-4 mr-2 text-stone-400')} ${app.customerPhone}</p>
                                                        </div>
                                                    </div>
                                                    <button class="admin-cancel-btn ml-4 p-2 text-red-500 hover:bg-red-100 rounded-full transition-colors flex-shrink-0" data-date-key="${dateKey}" data-index="${index}">${TrashIcon('h-5 w-5')}</button>
                                                </li>
                                            `).join('')}
                                        </ul>
                                    </div>
                                `}).join('')}
                        ` : `
                            <div class="space-y-4">
                                <div class="relative">
                                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">${SearchIcon('h-5 w-5 text-gray-400')}</div>
                                    <input type="text" id="customer-search" placeholder="Buscar por nombre o teléfono..." value="${searchTerm}" class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                                ${filteredCustomers.length > 0 ? `
                                    <ul class="space-y-2">
                                        ${filteredCustomers.map(customer => `
                                            <li class="bg-stone-50 p-3 rounded-lg border border-stone-200 flex items-center justify-between">
                                                <div class="text-sm text-stone-700">
                                                    <p class="font-semibold flex items-center">${UserIcon('h-4 w-4 mr-2 text-stone-400')} ${customer.name}</p>
                                                    <p class="mt-1 flex items-center">${PhoneIcon('h-4 w-4 mr-2 text-stone-400')} ${customer.phone}</p>
                                                </div>
                                                <button class="copy-phone-btn ml-4 p-2 rounded-full transition-colors flex-shrink-0 ${copiedPhone === customer.phone ? 'bg-green-100 text-green-600' : 'text-gray-500 hover:bg-gray-100'}" data-phone="${customer.phone}">
                                                    ${copiedPhone === customer.phone ? CheckCircleIcon('h-5 w-5') : ClipboardCopyIcon('h-5 w-5')}
                                                </button>
                                            </li>
                                        `).join('')}
                                    </ul>
                                ` : `<p class="text-stone-600 text-center py-8">${searchTerm ? 'No se encontraron clientes.' : 'No hay clientes en el archivo.'}</p>`}
                            </div>
                        `}
                    </div>
                    <button id="close-admin-btn-footer" class="mt-6 w-full bg-stone-800 text-white font-bold py-2 px-4 rounded-lg hover:bg-stone-900 transition-colors duration-200">Cerrar</button>
                </div>
            `;
            addAdminModalListeners();
        }

        const close = () => {
            modalContainer.classList.add('modal-hidden');
            modalContainer.innerHTML = '';
        }
        
        const addAdminModalListeners = () => {
            document.getElementById('close-admin-btn')?.addEventListener('click', close);
            document.getElementById('close-admin-btn-footer')?.addEventListener('click', close);
            document.querySelectorAll('.admin-view-btn').forEach(btn => btn.addEventListener('click', (e) => {
                view = e.currentTarget.dataset.view;
                renderContent();
            }));
            document.getElementById('customer-search')?.addEventListener('input', (e) => {
                searchTerm = e.target.value;
                renderContent();
            });
            document.querySelectorAll('.copy-phone-btn').forEach(btn => btn.addEventListener('click', (e) => {
                const phone = e.currentTarget.dataset.phone;
                navigator.clipboard.writeText(phone);
                copiedPhone = phone;
                renderContent();
                setTimeout(() => {
                    copiedPhone = null;
                    renderContent();
                }, 2000);
            }));
            document.querySelectorAll('.admin-cancel-btn').forEach(btn => btn.addEventListener('click', (e) => {
                const { dateKey, index } = e.currentTarget.dataset;
                const appointment = state.bookedAppointments[dateKey][index];
                state.adminCancelTarget = { dateKey, appointment };
                state.isAdminCancelConfirmationOpen = true;
                close();
                renderApp();
            }));
        }

        modalContainer.classList.remove('modal-hidden');
        renderContent();
    }


    // --- INITIAL RENDER ---
    renderApp();
});