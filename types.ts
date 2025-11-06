export type Service = 'Corte de pelo' | 'Arreglo de barba' | 'Corte y barba';

export interface Appointment {
  time: string;
  customerName: string;
  customerPhone: string;
  barber: 'Ismail' | 'Abdo';
  service: Service;
}

export interface BookedAppointments {
  [date: string]: Appointment[];
}

export interface Customer {
  name: string;
  phone: string;
  visitCount?: number;
  lastVisit?: string; // YYYY-MM-DD
  noShowCount?: number;
}

export interface VisitRecord {
    customerName: string;
    customerPhone: string;
    date: string; // YYYY-MM-DD
    time: string;
    barber: 'Ismail' | 'Abdo';
    service: Service;
}

export interface MissedAppointmentRecord {
    customerName: string;
    customerPhone: string;
    date: string; // YYYY-MM-DD
    time: string;
    barber: 'Ismail' | 'Abdo';
    service: Service;
}