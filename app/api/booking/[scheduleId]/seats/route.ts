import { db } from "@/lib/db";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    scheduleId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { scheduleId } = await params;

    if (!scheduleId) {
      return NextResponse.json(
        {
          success: false,
          message: "Schedule ID is required.",
        },
        { status: 400 },
      );
    }

    const schedule = await db.schedule.findUnique({
      where: {
        id: scheduleId,
      },
      include: {
        bus: true,
        route: true,
        seats: {
          orderBy: {
            seatNumber: "asc",
          },
        },
      },
    });

    if (!schedule) {
      return NextResponse.json(
        {
          success: false,
          message: "Schedule not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      schedule: {
        id: schedule.id,
        busName: schedule.bus.name,
        plateNumber: schedule.bus.plateNumber,
        origin: schedule.route.origin,
        destination: schedule.route.destination,
        departureTime: schedule.departureTime,
        arrivalTime: schedule.arrivalTime,
        price: schedule.price.toString(),
      },
      seats: schedule.seats.map((seat) => ({
        id: seat.id,
        seatNumber: seat.seatNumber,
        status: seat.status,
      })),
    });
  } catch (error) {
    console.error("Failed to load seats:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load seats.",
      },
      { status: 500 },
    );
  }
}