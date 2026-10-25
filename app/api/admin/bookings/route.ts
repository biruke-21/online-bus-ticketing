
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const bookings = await db.booking.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        passenger: true,
        schedule: {
          include: {
            bus: true,
            route: true,
          },
        },
        seats: {
          include: {
            seat: true,
          },
        },
        payment: true,
        ticket: true,
      },
    });

    const formattedBookings = bookings.map((booking) => ({
      id: booking.id,
      bookingReference: booking.bookingReference,
      status: booking.status,

      passengerName:
        booking.passenger?.fullName || booking.user.name,

      passengerEmail:
        booking.passenger?.email || booking.user.email,

      passengerPhone:
        booking.passenger?.phone || "N/A",

      origin: booking.schedule.route.origin,
      destination: booking.schedule.route.destination,
      busName: booking.schedule.bus.name,
      departureTime: booking.schedule.departureTime,

      seats: booking.seats.map(
        (item) => item.seat.seatNumber,
      ),

      totalAmount: Number(booking.totalAmount),

      paymentStatus:
        booking.payment?.status || "PENDING",

      ticketNumber:
        booking.ticket?.ticketNumber || null,

      createdAt: booking.createdAt,
    }));

    return NextResponse.json({
      success: true,
      bookings: formattedBookings,
    });
  } catch (error) {
    console.error("Admin bookings API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load bookings.",
      },
      { status: 500 },
    );
  }
}

