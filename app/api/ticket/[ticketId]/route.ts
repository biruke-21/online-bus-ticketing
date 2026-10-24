
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    ticketId: string;
  }>;
};

export async function GET(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const { ticketId } = await params;

    if (!ticketId) {
      return NextResponse.json(
        { success: false, message: "Ticket ID is required." },
        { status: 400 },
      );
    }

    const ticket = await db.ticket.findUnique({
      where: {
        id: ticketId,
      },
      include: {
        booking: {
          include: {
            passenger: true,
            payment: true,
            seats: {
              include: {
                seat: true,
              },
            },
            schedule: {
              include: {
                bus: true,
                route: true,
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: "Ticket not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        qrCode: ticket.qrCode,
        bookingReference: ticket.booking.bookingReference,
        passenger: ticket.booking.passenger
          ? {
              fullName: ticket.booking.passenger.fullName,
              phone: ticket.booking.passenger.phone,
              email: ticket.booking.passenger.email,
            }
          : null,
        paymentStatus: ticket.booking.payment?.status ?? "PENDING",
        totalAmount: ticket.booking.totalAmount.toString(),
        seats: ticket.booking.seats.map((bookingSeat) => ({
          id: bookingSeat.seat.id,
          seatNumber: bookingSeat.seat.seatNumber,
        })),
        trip: {
          busName: ticket.booking.schedule.bus.name,
          plateNumber: ticket.booking.schedule.bus.plateNumber,
          origin: ticket.booking.schedule.route.origin,
          destination: ticket.booking.schedule.route.destination,
          departureTime: ticket.booking.schedule.departureTime,
          arrivalTime: ticket.booking.schedule.arrivalTime,
          price: ticket.booking.schedule.price.toString(),
        },
      },
    });
  } catch (error) {
    console.error("Failed to load ticket:", error);

    return NextResponse.json(
      { success: false, message: "Unable to load ticket details." },
      { status: 500 },
    );
  }
}

