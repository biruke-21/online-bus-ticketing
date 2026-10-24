import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const bookingId = body.bookingId;

    if (!bookingId || typeof bookingId !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "A valid booking ID is required.",
        },
        { status: 400 },
      );
    }

    const booking = await db.booking.findUnique({
      where: {
        id: bookingId,
      },
      include: {
        payment: true,
        ticket: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          message: "Booking not found.",
        },
        { status: 404 },
      );
    }

    if (booking.status !== "CONFIRMED") {
      return NextResponse.json(
        {
          success: false,
          message: "Your booking is not confirmed yet.",
        },
        { status: 400 },
      );
    }

    if (booking.payment?.status !== "PAID") {
      return NextResponse.json(
        {
          success: false,
          message: "Payment has not been confirmed.",
        },
        { status: 400 },
      );
    }

    // Reuse the ticket if it already exists.
    if (booking.ticket) {
      return NextResponse.json({
        success: true,
        message: "Ticket already exists.",
        ticket: {
          id: booking.ticket.id,
          ticketNumber: booking.ticket.ticketNumber,
        },
      });
    }

    const ticketNumber = `BUS-${randomUUID()
      .replace(/-/g, "")
      .slice(0, 8)
      .toUpperCase()}`;

    const ticket = await db.ticket.create({
      data: {
        bookingId: booking.id,
        ticketNumber,
        qrCode: JSON.stringify({
          ticketNumber,
          bookingReference: booking.bookingReference,
        }),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Ticket created successfully.",
        ticket: {
          id: ticket.id,
          ticketNumber: ticket.ticketNumber,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create ticket:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create ticket.",
      },
      { status: 500 },
    );
  }
}