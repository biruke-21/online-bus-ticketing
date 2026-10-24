
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const ticketNumber = body.ticketNumber;
    const bookingReference = body.bookingReference;

    if (
      typeof ticketNumber !== "string" ||
      typeof bookingReference !== "string" ||
      !ticketNumber.trim() ||
      !bookingReference.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          message: "Ticket number and booking reference are required.",
        },
        { status: 400 },
      );
    }

    const ticket = await db.ticket.findFirst({
      where: {
        ticketNumber: ticketNumber.trim(),
        booking: {
          bookingReference: bookingReference.trim(),
        },
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
      return NextResponse.json({
        success: true,
        valid: false,
        alreadyBoarded: false,
        message: "INVALID TICKET. No matching ticket was found.",
      });
    }

    const paymentStatus = ticket.booking.payment?.status ?? "PENDING";
    const bookingStatus = ticket.booking.status;

    if (paymentStatus !== "PAID" || bookingStatus !== "CONFIRMED") {
      return NextResponse.json({
        success: true,
        valid: false,
        alreadyBoarded: false,
        message:
          "BOARDING DENIED. Payment or booking is not confirmed.",
        ticket: {
          ticketNumber: ticket.ticketNumber,
          bookingReference: ticket.booking.bookingReference,
          paymentStatus,
          bookingStatus,
        },
      });
    }

    // Atomically mark the ticket as boarded only if it has not
    // already been used. This prevents two simultaneous scans
    // from both accepting the same ticket.
    const boarding = await db.ticket.updateMany({
      where: {
        id: ticket.id,
        boarded: false,
      },
      data: {
        boarded: true,
        boardedAt: new Date(),
      },
    });

    // If no row was updated, another scan already boarded this ticket.
    if (boarding.count === 0) {
      const latestTicket = await db.ticket.findUnique({
        where: {
          id: ticket.id,
        },
        select: {
          boarded: true,
          boardedAt: true,
        },
      });

      if (latestTicket?.boarded) {
        return NextResponse.json({
          success: true,
          valid: false,
          alreadyBoarded: true,
          message: "ALREADY BOARDED. This ticket has already been used.",
          ticket: {
            ticketNumber: ticket.ticketNumber,
            bookingReference: ticket.booking.bookingReference,
            boardedAt: latestTicket.boardedAt,
          },
        });
      }

      return NextResponse.json(
        {
          success: false,
          valid: false,
          alreadyBoarded: false,
          message: "Unable to confirm boarding. Please try again.",
        },
        { status: 409 },
      );
    }

    const updatedTicket = await db.ticket.findUnique({
      where: {
        id: ticket.id,
      },
      select: {
        boarded: true,
        boardedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      valid: true,
      alreadyBoarded: false,
      message: "VALID TICKET. Passenger is approved for boarding.",
      ticket: {
        ticketNumber: ticket.ticketNumber,
        bookingReference: ticket.booking.bookingReference,
        passengerName: ticket.booking.passenger?.fullName ?? "Not provided",
        busName: ticket.booking.schedule.bus.name,
        plateNumber: ticket.booking.schedule.bus.plateNumber,
        origin: ticket.booking.schedule.route.origin,
        destination: ticket.booking.schedule.route.destination,
        departureTime: ticket.booking.schedule.departureTime,
        paymentStatus,
        bookingStatus,
        totalAmount: ticket.booking.totalAmount.toString(),
        boarded: updatedTicket?.boarded ?? true,
        boardedAt: updatedTicket?.boardedAt ?? new Date(),
        seats: ticket.booking.seats.map((bookingSeat) => ({
          seatNumber: bookingSeat.seat.seatNumber,
        })),
      },
    });
  } catch (error) {
    console.error("Ticket verification failed:", error);

    return NextResponse.json(
      {
        success: false,
        valid: false,
        message: "Unable to verify the ticket. Please try again.",
      },
      { status: 500 },
    );
  }
}

