export type UserRole = "PASSENGER" | "ADMIN";

export type BusStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE";

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
}

export interface Bus {
  id: string;
  name: string;
  plateNumber: string;
  seatCount: number;
  status: BusStatus;
}

export interface Route {
  id: string;
  origin: string;
  destination: string;
  distance?: number;
  duration?: number;
}

export interface Schedule {
  id: string;
  busId: string;
  routeId: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
}

export interface Booking {
  id: string;
  userId: string;
  scheduleId: string;
  bookingReference: string;
  status: BookingStatus;
  totalAmount: number;
}

export interface Ticket {
  id: string;
  bookingId: string;
  passengerName: string;
  seatNumber: string;
  qrCode: string;
}