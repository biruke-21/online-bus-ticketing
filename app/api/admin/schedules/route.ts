import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

type ScheduleInput = {
  id?: string;
  busId?: string;
  routeId?: string;
  departureTime?: string;
  arrivalTime?: string;
  price?: number | string;
};

function isValidDate(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim() !== "" &&
    !Number.isNaN(Date.parse(value))
  );
}

function isValidPrice(value: unknown): boolean {
  if (value === undefined || value === null || value === "") {
    return false;
  }

  const price = Number(value);

  return Number.isFinite(price) && price > 0;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "An unexpected server error occurred.";
}

// GET: Retrieve all schedules
export async function GET() {
  try {
    const schedules = await db.schedule.findMany({
      orderBy: {
        departureTime: "desc",
      },
      include: {
        bus: {
          select: {
            id: true,
            name: true,
            plateNumber: true,
            seatCount: true,
            status: true,
          },
        },
        route: {
          select: {
            id: true,
            origin: true,
            destination: true,
            distanceKm: true,
            durationMin: true,
          },
        },
        _count: {
          select: {
            seats: true,
            bookings: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      schedules,
    });
  } catch (error) {
    console.error("GET /api/admin/schedules error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve schedules.",
        error: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}

// POST: Create a schedule
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ScheduleInput;

    const {
      busId,
      routeId,
      departureTime,
      arrivalTime,
      price,
    } = body;

    // Validate required fields
    if (
      !busId ||
      !routeId ||
      !isValidDate(departureTime) ||
      !isValidDate(arrivalTime) ||
      !isValidPrice(price)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Provide a bus, route, valid departure and arrival times, and a price greater than zero.",
        },
        { status: 400 },
      );
    }

    const departure = new Date(departureTime);
    const arrival = new Date(arrivalTime);
    const schedulePrice = new Prisma.Decimal(String(price));

    // Validate arrival time
    if (arrival <= departure) {
      return NextResponse.json(
        {
          success: false,
          message: "Arrival time must be later than departure time.",
        },
        { status: 400 },
      );
    }

    // Check that the selected bus and route exist
    const [bus, route] = await Promise.all([
      db.bus.findUnique({
        where: { id: busId },
      }),
      db.route.findUnique({
        where: { id: routeId },
      }),
    ]);

    if (!bus) {
      return NextResponse.json(
        {
          success: false,
          message: "Selected bus was not found.",
        },
        { status: 404 },
      );
    }

    if (!route) {
      return NextResponse.json(
        {
          success: false,
          message: "Selected route was not found.",
        },
        { status: 404 },
      );
    }

    // Create the schedule
    const schedule = await db.schedule.create({
      data: {
        busId,
        routeId,
        departureTime: departure,
        arrivalTime: arrival,
        price: schedulePrice,
      },
      include: {
        bus: {
          select: {
            id: true,
            name: true,
            plateNumber: true,
            seatCount: true,
            status: true,
          },
        },
        route: {
          select: {
            id: true,
            origin: true,
            destination: true,
            distanceKm: true,
            durationMin: true,
          },
        },
        _count: {
          select: {
            seats: true,
            bookings: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Schedule created successfully.",
        schedule,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/admin/schedules error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create schedule.",
        error: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}

// PUT: Update an existing schedule
export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as ScheduleInput;

    const {
      id,
      busId,
      routeId,
      departureTime,
      arrivalTime,
      price,
    } = body;

    if (
      !id ||
      !busId ||
      !routeId ||
      !isValidDate(departureTime) ||
      !isValidDate(arrivalTime) ||
      !isValidPrice(price)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Provide a schedule ID and all valid schedule fields.",
        },
        { status: 400 },
      );
    }

    const departure = new Date(departureTime);
    const arrival = new Date(arrivalTime);

    if (arrival <= departure) {
      return NextResponse.json(
        {
          success: false,
          message: "Arrival time must be later than departure time.",
        },
        { status: 400 },
      );
    }

    const schedulePrice = new Prisma.Decimal(String(price));

    const existingSchedule = await db.schedule.findUnique({
      where: { id },
    });

    if (!existingSchedule) {
      return NextResponse.json(
        {
          success: false,
          message: "Schedule not found.",
        },
        { status: 404 },
      );
    }

    const [bus, route] = await Promise.all([
      db.bus.findUnique({
        where: { id: busId },
      }),
      db.route.findUnique({
        where: { id: routeId },
      }),
    ]);

    if (!bus || !route) {
      return NextResponse.json(
        {
          success: false,
          message: "Selected bus or route was not found.",
        },
        { status: 404 },
      );
    }

    const schedule = await db.schedule.update({
      where: { id },
      data: {
        busId,
        routeId,
        departureTime: departure,
        arrivalTime: arrival,
        price: schedulePrice,
      },
      include: {
        bus: {
          select: {
            id: true,
            name: true,
            plateNumber: true,
            seatCount: true,
            status: true,
          },
        },
        route: {
          select: {
            id: true,
            origin: true,
            destination: true,
            distanceKm: true,
            durationMin: true,
          },
        },
        _count: {
          select: {
            seats: true,
            bookings: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Schedule updated successfully.",
      schedule,
    });
  } catch (error) {
    console.error("PUT /api/admin/schedules error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update schedule.",
        error: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}

// DELETE: Delete a schedule using ?id=SCHEDULE_ID
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Schedule ID is required.",
        },
        { status: 400 },
      );
    }

    const existingSchedule = await db.schedule.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });

    if (!existingSchedule) {
      return NextResponse.json(
        {
          success: false,
          message: "Schedule not found.",
        },
        { status: 404 },
      );
    }

    if (existingSchedule._count.bookings > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "This schedule has bookings and cannot be deleted.",
        },
        { status: 409 },
      );
    }

    await db.schedule.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Schedule deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE /api/admin/schedules error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete schedule.",
        error: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}