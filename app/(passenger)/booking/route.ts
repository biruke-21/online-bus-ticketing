import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";

export const runtime = "nodejs";

type BookingRequest = {
  scheduleId?: string;
  seatIds?: string[];
  passenger?: {
    fullName?: string;
    phone?: string;
    email?: string;
    identification?: string;
  };
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as BookingRequest;

    const scheduleId = body.scheduleId;
    const seatIds = body.seatIds;
    const passenger = body.passenger;

    if (
      !scheduleId ||
      !Array.isArray(seatIds) ||
      seatIds.length === 0 ||
      !passenger?.fullName?.trim() ||
      !passenger?.phone?.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Schedule, selected seats, passenger name, and phone are required.",
        },
        { status: 400 },
      );
    }

    if (
      seatIds.some(
        (id) => typeof id !== "string" || id.length === 0,
      ) ||
      new Set(seatIds).size !== seatIds.length
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "The selected seats are invalid.",
        },
        { status: 400 },
      );
    }

    const fullName = passenger.fullName.trim();
    const phone = passenger.phone.trim();
    const email = passenger.email?.trim() || null;
    const identification =
      passenger.identification?.trim() || null;

    const booking = await db.$transaction(
      async (tx) => {
        const schedule = await tx.schedule.findUnique({
          where: { id: scheduleId },
          include: {
            bus: true,
          },
        });

        if (!schedule) {
          throw new Error("SCHEDULE_NOT_FOUND");
        }

        if (schedule.departureTime <= new Date()) {
          throw new Error("TRIP_ALREADY_STARTED");
        }

        // Create or reuse a guest account for this passenger.
        // Guest accounts cannot log in until authentication is implemented.
        const guestEmail =
          `guest-${randomUUID()}@busgo.invalid`;

        const user = await tx.user.create({
          data: {
            name: fullName,
            email: guestEmail,
            phone,
            passwordHash: randomUUID(),
            role: "PASSENGER",
          },
        });

        // Lock the requested seat records while checking and reserving them.
        const lockedSeats = await tx.$queryRaw<
          { id: string; status: string; scheduleId: string }[]
        >`
          SELECT id, status, "scheduleId"
          FROM "Seat"
          WHERE id IN (${Prisma.join(seatIds)})
          FOR UPDATE
        `;

        if (lockedSeats.length !== seatIds.length) {
          throw new Error("SEAT_NOT_FOUND");
        }

        const allBelongToSchedule = lockedSeats.every(
          (seat) => seat.scheduleId === scheduleId,
        );

        if (!allBelongToSchedule) {
          throw new Error("SEAT_SCHEDULE_MISMATCH");
        }

        const unavailable = lockedSeats.some(
          (seat) => seat.status !== "AVAILABLE",
        );

        if (unavailable) {
          throw new Error("SEAT_UNAVAILABLE");
        }

        const totalAmount =
          Number(schedule.price) * seatIds.length;

        const bookingReference =
          `BG-${randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;

        const createdBooking = await tx.booking.create({
          data: {
            userId: user.id,
            scheduleId,
            bookingReference,
            status: "PENDING",
            totalAmount,
            passenger: {
              create: {
                fullName,
                phone,
                email,
                identification,
              },
            },
            payment: {
              create: {
                amount: totalAmount,
                status: "PENDING",
              },
            },
          },
        });

        await tx.bookingSeat.createMany({
          data: seatIds.map((seatId) => ({
            bookingId: createdBooking.id,
            seatId,
          })),
        });

        await tx.seat.updateMany({
          where: {
            id: { in: seatIds },
            status: "AVAILABLE",
          },
          data: {
            status: "BOOKED",
          },
        });

        return {
          id: createdBooking.id,
          bookingReference: createdBooking.bookingReference,
          status: createdBooking.status,
          totalAmount,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    return NextResponse.json(
      {
        success: true,
        message: "Pending booking created successfully.",
        booking,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Booking creation failed:", error);

    if (error instanceof Error) {
      if (error.message === "SCHEDULE_NOT_FOUND") {
        return NextResponse.json(
          { success: false, message: "The trip could not be found." },
          { status: 404 },
        );
      }

      if (error.message === "TRIP_ALREADY_STARTED") {
        return NextResponse.json(
          { success: false, message: "This trip has already departed." },
          { status: 400 },
        );
      }

      if (error.message === "SEAT_NOT_FOUND") {
        return NextResponse.json(
          { success: false, message: "One or more seats could not be found." },
          { status: 400 },
        );
      }

      if (error.message === "SEAT_SCHEDULE_MISMATCH") {
        return NextResponse.json(
          { success: false, message: "A selected seat belongs to another trip." },
          { status: 400 },
        );
      }

      if (error.message === "SEAT_UNAVAILABLE") {
        return NextResponse.json(
          {
            success: false,
            message: "One or more seats are no longer available. Please select different seats.",
          },
          { status: 409 },
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to create the booking. Please try again.",
      },
      { status: 500 },
    );
  }
}