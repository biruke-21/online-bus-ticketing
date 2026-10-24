import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";

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

    const uniqueSeatIds = [...new Set(seatIds)];

    if (uniqueSeatIds.length !== seatIds.length) {
      return NextResponse.json(
        {
          success: false,
          message: "Duplicate seats were selected.",
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
          where: {
            id: scheduleId,
          },
        });

        if (!schedule) {
          throw new Error("SCHEDULE_NOT_FOUND");
        }

        const seats = await tx.seat.findMany({
          where: {
            id: {
              in: uniqueSeatIds,
            },
            scheduleId,
          },
        });

        if (seats.length !== uniqueSeatIds.length) {
          throw new Error("SEAT_NOT_FOUND");
        }

        const unavailableSeat = seats.find(
          (seat) => seat.status !== "AVAILABLE",
        );

        if (unavailableSeat) {
          throw new Error("SEAT_UNAVAILABLE");
        }

        const user = await tx.user.create({
          data: {
            name: fullName,
            email: `guest-${randomUUID()}@busgo.invalid`,
            phone,
            passwordHash: randomUUID(),
            role: "PASSENGER",
          },
        });

        const totalAmount =
          Number(schedule.price) * uniqueSeatIds.length;

        const bookingReference =
          `BG-${randomUUID()
            .replace(/-/g, "")
            .slice(0, 10)
            .toUpperCase()}`;

        const createdBooking =
          await tx.booking.create({
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
          data: uniqueSeatIds.map((seatId) => ({
            bookingId: createdBooking.id,
            seatId,
          })),
        });

        await tx.seat.updateMany({
          where: {
            id: {
              in: uniqueSeatIds,
            },
            status: "AVAILABLE",
          },
          data: {
            status: "BOOKED",
          },
        });

        return {
          id: createdBooking.id,
          bookingReference:
            createdBooking.bookingReference,
          status: createdBooking.status,
          totalAmount: totalAmount.toString(),
        };
      },
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    return NextResponse.json(
      {
        success: true,
        message: "Booking created successfully.",
        booking,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Booking creation failed:",
      error,
    );

    if (error instanceof Error) {
      if (error.message === "SCHEDULE_NOT_FOUND") {
        return NextResponse.json(
          {
            success: false,
            message: "The selected trip could not be found.",
          },
          { status: 404 },
        );
      }

      if (error.message === "SEAT_NOT_FOUND") {
        return NextResponse.json(
          {
            success: false,
            message:
              "One or more selected seats could not be found.",
          },
          { status: 400 },
        );
      }

      if (error.message === "SEAT_UNAVAILABLE") {
        return NextResponse.json(
          {
            success: false,
            message:
              "One or more selected seats are no longer available. Please select another seat.",
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