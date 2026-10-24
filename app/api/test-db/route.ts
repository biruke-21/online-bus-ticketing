import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const users = await db.user.count();
    const buses = await db.bus.count();
    const routes = await db.route.count();
    const schedules = await db.schedule.count();
    const seats = await db.seat.count();

    return NextResponse.json({
      success: true,
      database: "connected",
      counts: {
        users,
        buses,
        routes,
        schedules,
        seats,
      },
    });
  } catch (error) {
    console.error("Database test failed:", error);

    return NextResponse.json(
      {
        success: false,
        database: "connection failed",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}