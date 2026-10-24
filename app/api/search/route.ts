import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const origin = searchParams.get("origin");
    const destination = searchParams.get("destination");
    const date = searchParams.get("date");

    if (!origin || !destination) {
      return NextResponse.json(
        {
          success: false,
          message: "Origin and destination are required.",
        },
        { status: 400 },
      );
    }

    const startDate = date
      ? new Date(`${date}T00:00:00`)
      : new Date();

    const endDate = date
      ? new Date(`${date}T23:59:59.999`)
      : new Date();

    const schedules = await db.schedule.findMany({
      where: {
        departureTime: {
          gte: startDate,
          lte: endDate,
        },
        route: {
          origin: {
            equals: origin,
            mode: "insensitive",
          },
          destination: {
            equals: destination,
            mode: "insensitive",
          },
        },
      },
      include: {
        bus: true,
        route: true,
        seats: {
          where: {
            status: "AVAILABLE",
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        departureTime: "asc",
      },
    });

    const results = schedules.map((schedule) => ({
      id: schedule.id,
      busName: schedule.bus.name,
      plateNumber: schedule.bus.plateNumber,
      origin: schedule.route.origin,
      destination: schedule.route.destination,
      departureTime: schedule.departureTime,
      arrivalTime: schedule.arrivalTime,
      price: schedule.price.toString(),
      availableSeats: schedule.seats.length,
    }));

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("Search failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to search for buses.",
      },
      { status: 500 },
    );
  }
}