
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// ============================================
// GET: Fetch all bus routes
// URL: GET /api/admin/routes
// ============================================
export async function GET() {
  try {
    const routes = await db.route.findMany({
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
      routes,
    });
  } catch (error) {
    console.error("Admin routes GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load routes.",
      },
      { status: 500 },
    );
  }
}

// ============================================
// POST: Create a new bus route
// URL: POST /api/admin/routes
// ============================================
export async function POST(request: Request) {
  try {
    let body: {
      origin?: unknown;
      destination?: unknown;
      distanceKm?: unknown;
      durationMin?: unknown;
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

    const origin =
      typeof body.origin === "string" ? body.origin.trim() : "";

    const destination =
      typeof body.destination === "string"
        ? body.destination.trim()
        : "";

    if (!origin || !destination) {
      return NextResponse.json(
        {
          success: false,
          message: "Origin and destination are required.",
        },
        { status: 400 },
      );
    }

    if (origin.toLowerCase() === destination.toLowerCase()) {
      return NextResponse.json(
        {
          success: false,
          message: "Origin and destination cannot be the same.",
        },
        { status: 400 },
      );
    }

    const distanceKm =
      body.distanceKm === undefined ||
      body.distanceKm === null ||
      body.distanceKm === ""
        ? null
        : Number(body.distanceKm);

    const durationMin =
      body.durationMin === undefined ||
      body.durationMin === null ||
      body.durationMin === ""
        ? null
        : Number(body.durationMin);

    if (
      distanceKm !== null &&
      (!Number.isFinite(distanceKm) || distanceKm <= 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Distance must be a positive number.",
        },
        { status: 400 },
      );
    }

    if (
      durationMin !== null &&
      (!Number.isInteger(durationMin) || durationMin <= 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Duration must be a positive whole number of minutes.",
        },
        { status: 400 },
      );
    }

    // Prevent duplicate routes in the same direction.
    const existingRoute = await db.route.findFirst({
      where: {
        origin: {
          equals: origin,
          mode: "insensitive",
        },
        destination: {
          equals: destination,
          mode: "insensitive",
        },
      },
    });

    if (existingRoute) {
      return NextResponse.json(
        {
          success: false,
          message: "This route already exists.",
        },
        { status: 409 },
      );
    }

    const route = await db.route.create({
      data: {
        origin,
        destination,
        distanceKm,
        durationMin,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Route created successfully.",
        route,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Admin routes POST error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create route.",
      },
      { status: 500 },
    );
  }
}

// ============================================
// PUT: Update an existing bus route
// URL: PUT /api/admin/routes
// ============================================
export async function PUT(request: Request) {
  try {
    let body: {
      id?: unknown;
      origin?: unknown;
      destination?: unknown;
      distanceKm?: unknown;
      durationMin?: unknown;
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

    const id = typeof body.id === "string" ? body.id.trim() : "";

    const origin =
      typeof body.origin === "string" ? body.origin.trim() : "";

    const destination =
      typeof body.destination === "string"
        ? body.destination.trim()
        : "";

    if (!id || !origin || !destination) {
      return NextResponse.json(
        {
          success: false,
          message: "Route ID, origin, and destination are required.",
        },
        { status: 400 },
      );
    }

    if (origin.toLowerCase() === destination.toLowerCase()) {
      return NextResponse.json(
        {
          success: false,
          message: "Origin and destination cannot be the same.",
        },
        { status: 400 },
      );
    }

    const distanceKm =
      body.distanceKm === undefined ||
      body.distanceKm === null ||
      body.distanceKm === ""
        ? null
        : Number(body.distanceKm);

    const durationMin =
      body.durationMin === undefined ||
      body.durationMin === null ||
      body.durationMin === ""
        ? null
        : Number(body.durationMin);

    if (
      distanceKm !== null &&
      (!Number.isFinite(distanceKm) || distanceKm <= 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Distance must be a positive number.",
        },
        { status: 400 },
      );
    }

    if (
      durationMin !== null &&
      (!Number.isInteger(durationMin) || durationMin <= 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Duration must be a positive whole number of minutes.",
        },
        { status: 400 },
      );
    }

    const existingRoute = await db.route.findUnique({
      where: { id },
    });

    if (!existingRoute) {
      return NextResponse.json(
        {
          success: false,
          message: "Route not found.",
        },
        { status: 404 },
      );
    }

    const duplicateRoute = await db.route.findFirst({
      where: {
        id: { not: id },
        origin: {
          equals: origin,
          mode: "insensitive",
        },
        destination: {
          equals: destination,
          mode: "insensitive",
        },
      },
    });

    if (duplicateRoute) {
      return NextResponse.json(
        {
          success: false,
          message: "Another route already uses these locations.",
        },
        { status: 409 },
      );
    }

    const updatedRoute = await db.route.update({
      where: { id },
      data: {
        origin,
        destination,
        distanceKm,
        durationMin,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Route updated successfully.",
      route: updatedRoute,
    });
  } catch (error) {
    console.error("Admin routes PUT error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update route.",
      },
      { status: 500 },
    );
  }
}

// ============================================
// DELETE: Delete a route if it has no schedules
// URL: DELETE /api/admin/routes?id=ROUTE_ID
// ============================================
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")?.trim();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Route ID is required.",
        },
        { status: 400 },
      );
    }

    const existingRoute = await db.route.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            schedules: true,
          },
        },
      },
    });

    if (!existingRoute) {
      return NextResponse.json(
        {
          success: false,
          message: "Route not found.",
        },
        { status: 404 },
      );
    }

    if (existingRoute._count.schedules > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This route cannot be deleted because it has schedules. Remove or reassign those schedules first.",
        },
        { status: 409 },
      );
    }

    await db.route.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Route deleted successfully.",
    });
  } catch (error) {
    console.error("Admin routes DELETE error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete route.",
      },
      { status: 500 },
    );
  }
}
