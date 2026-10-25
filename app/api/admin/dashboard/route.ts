
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-auth";

export async function GET() {
  try {
    // 1. Verify that the current user is an active administrator.
    const auth = await requireAdminApi();

    if (!auth.authorized) {
      return auth.response;
    }

    // 2. Fetch dashboard data from PostgreSQL.
    const [
      totalBookings,
      totalTickets,
      boardedPassengers,
      paidPayments,
      recentBookings,
    ] = await Promise.all([
      // Count all bookings.
      db.booking.count(),

      // Count issued tickets.
      db.ticket.count(),

      // Count passengers who have boarded.
      db.ticket.count({
        where: {
          boarded: true,
        },
      }),

      // Retrieve successful payments.
      db.payment.findMany({
        where: {
          status: "PAID",
        },
        select: {
          amount: true,
        },
      }),

      // Retrieve the five most recent bookings.
      db.booking.findMany({
        take: 5,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          bookingReference: true,
          status: true,
          totalAmount: true,
          createdAt: true,

          user: {
            select: {
              name: true,
              email: true,
              phone: true,
            },
          },

          passenger: {
            select: {
              fullName: true,
              phone: true,
            },
          },

          schedule: {
            select: {
              departureTime: true,

              bus: {
                select: {
                  name: true,
                  plateNumber: true,
                },
              },

              route: {
                select: {
                  origin: true,
                  destination: true,
                },
              },
            },
          },

          payment: {
            select: {
              status: true,
            },
          },

          ticket: {
            select: {
              ticketNumber: true,
              boarded: true,
            },
          },
        },
      }),
    ]);

    // 3. Calculate revenue from payments marked PAID only.
    const totalRevenue = paidPayments.reduce(
      (total, payment) => total + Number(payment.amount),
      0,
    );

    // 4. Return the dashboard response.
    return NextResponse.json({
      success: true,

      stats: {
        totalBookings,
        totalRevenue,
        totalTickets,
        boardedPassengers,
      },

      recentBookings: recentBookings.map((booking) => ({
        id: booking.id,
        bookingReference: booking.bookingReference,
        status: booking.status,
        totalAmount: Number(booking.totalAmount),

        passengerName:
          booking.passenger?.fullName ?? booking.user.name,

        passengerEmail: booking.user.email,

        passengerPhone:
          booking.passenger?.phone ??
          booking.user.phone ??
          "N/A",

        busName: booking.schedule.bus.name,
        plateNumber: booking.schedule.bus.plateNumber,

        origin: booking.schedule.route.origin,
        destination: booking.schedule.route.destination,

        departureTime: booking.schedule.departureTime,

        paymentStatus: booking.payment?.status ?? "PENDING",

        ticketNumber: booking.ticket?.ticketNumber ?? null,

        boarded: booking.ticket?.boarded ?? false,

        createdAt: booking.createdAt,
      })),
    });
  } catch (error) {
    console.error("Admin dashboard API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load dashboard information.",
      },
      {
        status: 500,
      },
    );
  }
}
