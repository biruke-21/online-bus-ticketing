
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// ============================================
// GET: Fetch all buses
// URL: GET /api/admin/buses
// ============================================
export async function GET() {
  try {
    const buses = await db.bus.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            schedules: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      buses,
    });
  } catch (error) {
    console.error("Admin buses GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load buses from the database.",
      },
      { status: 500 },
    );
  }
}

// ============================================
// POST: Add a new bus
// URL: POST /api/admin/buses
// ============================================
export async function POST(request: Request) {
  try {
    let body: {
      name?: unknown;
      plateNumber?: unknown;
      seatCount?: unknown;
      status?: unknown;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON request body.",
        },
        { status: 400 },
      );
    }

    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    const plateNumber =
      typeof body.plateNumber === "string"
        ? body.plateNumber.trim()
        : "";

    const seatCount = Number(body.seatCount);

    const status =
      typeof body.status === "string"
        ? body.status
        : "ACTIVE";

    const validStatuses = [
      "ACTIVE",
      "INACTIVE",
      "MAINTENANCE",
    ] as const;

    type ValidBusStatus = (typeof validStatuses)[number];

    if (!name || !plateNumber) {
      return NextResponse.json(
        {
          success: false,
          message: "Bus name and plate number are required.",
        },
        { status: 400 },
      );
    }

    if (
      body.seatCount === undefined ||
      body.seatCount === null ||
      body.seatCount === "" ||
      !Number.isInteger(seatCount) ||
      seatCount < 1 ||
      seatCount > 200
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Seat count must be between 1 and 200.",
        },
        { status: 400 },
      );
    }

    if (!validStatuses.includes(status as ValidBusStatus)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid bus status.",
        },
        { status: 400 },
      );
    }

    // Prevent duplicate plate numbers.
    const existingBus = await db.bus.findUnique({
      where: {
        plateNumber,
      },
    });

    if (existingBus) {
      return NextResponse.json(
        {
          success: false,
          message: "A bus with this plate number already exists.",
        },
        { status: 409 },
      );
    }

    const bus = await db.bus.create({
      data: {
        name,
        plateNumber,
        seatCount,
        status: status as ValidBusStatus,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Bus added successfully.",
        bus,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Admin buses POST error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to add bus. Please try again.",
      },
      { status: 500 },
    );
  }
}

// ============================================
// PUT: Update an existing bus
// URL: PUT /api/admin/buses
// ============================================
export async function PUT(request: Request) {
  try {
    let body: {
      id?: unknown;
      name?: unknown;
      plateNumber?: unknown;
      seatCount?: unknown;
      status?: unknown;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON request body.",
        },
        { status: 400 },
      );
    }

    const id =
      typeof body.id === "string" ? body.id.trim() : "";

    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    const plateNumber =
      typeof body.plateNumber === "string"
        ? body.plateNumber.trim()
        : "";

    const seatCount = Number(body.seatCount);

    const status =
      typeof body.status === "string" ? body.status : "";

    const validStatuses = [
      "ACTIVE",
      "INACTIVE",
      "MAINTENANCE",
    ] as const;

    type ValidBusStatus = (typeof validStatuses)[number];

    // Check required fields.
    if (!id || !name || !plateNumber) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Bus ID, name, and plate number are required.",
        },
        { status: 400 },
      );
    }

    // Validate seat capacity.
    if (
      body.seatCount === undefined ||
      body.seatCount === null ||
      body.seatCount === "" ||
      !Number.isInteger(seatCount) ||
      seatCount < 1 ||
      seatCount > 200
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Seat count must be between 1 and 200.",
        },
        { status: 400 },
      );
    }

    // Validate bus status.
    if (!validStatuses.includes(status as ValidBusStatus)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid bus status. Use ACTIVE, INACTIVE, or MAINTENANCE.",
        },
        { status: 400 },
      );
    }

    // Check that the bus exists.
    const existingBus = await db.bus.findUnique({
      where: {
        id,
      },
    });

    if (!existingBus) {
      return NextResponse.json(
        {
          success: false,
          message: "Bus not found.",
        },
        { status: 404 },
      );
    }

    // Check whether another bus uses the same plate number.
    const duplicatePlate = await db.bus.findFirst({
      where: {
        plateNumber,
        NOT: {
          id,
        },
      },
      select: {
        id: true,
      },
    });

    if (duplicatePlate) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Another bus already uses this plate number.",
        },
        { status: 409 },
      );
    }

    // Find the highest existing seat number across this bus's schedules.
    const highestSeat = await db.seat.findFirst({
      where: {
        schedule: {
          busId: id,
        },
      },
      orderBy: {
        seatNumber: "desc",
      },
      select: {
        seatNumber: true,
      },
    });

    const highestSeatNumber = highestSeat
      ? Number(highestSeat.seatNumber)
      : 0;

    // Do not reduce capacity below existing seat numbers.
    if (
      highestSeat &&
      (!Number.isInteger(highestSeatNumber) ||
        highestSeatNumber > seatCount)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Seat capacity cannot be lower than an existing seat number.",
        },
        { status: 400 },
      );
    }

    // Update the bus.
    const updatedBus = await db.bus.update({
      where: {
        id,
      },
      data: {
        name,
        plateNumber,
        seatCount,
        status: status as ValidBusStatus,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Bus updated successfully.",
      bus: updatedBus,
    });
  } catch (error) {
    console.error("Admin buses PUT error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update bus. Please try again.",
      },
      { status: 500 },
    );
  }
}

