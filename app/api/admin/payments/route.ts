
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

type PaymentRequest = {
  bookingId?: string;
};

/**
 * GET /api/admin/payments
 * Retrieve payment records for the admin dashboard.
 */
export async function GET() {
  try {
    const payments = await db.payment.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        booking: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            passenger: true,
            schedule: {
              include: {
                bus: true,
                route: true,
              },
            },
          },
        },
      },
    });

    const formattedPayments = payments.map((payment) => ({
      id: payment.id,
      bookingId: payment.bookingId,
      bookingReference: payment.booking.bookingReference,

      passengerName:
        payment.booking.passenger?.fullName ??
        payment.booking.user.name,

      passengerEmail:
        payment.booking.passenger?.email ??
        payment.booking.user.email,

      origin: payment.booking.schedule.route.origin,
      destination: payment.booking.schedule.route.destination,
      busName: payment.booking.schedule.bus.name,

      amount: Number(payment.booking.totalAmount),

      paymentStatus: payment.status,
      paymentMethod: payment.method ?? "N/A",
      transactionId: payment.transactionId ?? "N/A",

      bookingStatus: payment.booking.status,
      createdAt: payment.createdAt,
    }));

    return NextResponse.json({
      success: true,
      payments: formattedPayments,
    });
  } catch (error) {
    console.error("Admin payments API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load payment records.",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/payments
 * Complete a test payment and confirm its booking.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PaymentRequest;
    const bookingId = body.bookingId;

    if (!bookingId || typeof bookingId !== "string" || !bookingId.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Booking ID is required.",
        },
        { status: 400 },
      );
    }

    const result = await db.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: {
          id: bookingId,
        },
        include: {
          payment: true,
        },
      });

      if (!booking) {
        throw new Error("BOOKING_NOT_FOUND");
      }

      if (booking.status === "CANCELLED") {
        throw new Error("BOOKING_CANCELLED");
      }

      if (!booking.payment) {
        throw new Error("PAYMENT_NOT_FOUND");
      }

      // Avoid processing a payment that is already complete.
      if (booking.payment.status === "PAID") {
        return {
          bookingId: booking.id,
          bookingReference: booking.bookingReference,
          bookingStatus: booking.status,
          paymentStatus: booking.payment.status,
          transactionId: booking.payment.transactionId,
        };
      }

      const payment = await tx.payment.update({
        where: {
          bookingId,
        },
        data: {
          status: "PAID",
          method: "TEST_PAYMENT",
          transactionId: `TEST-${Date.now()}-${bookingId.slice(0, 8)}`,
        },
      });

      const updatedBooking = await tx.booking.update({
        where: {
          id: bookingId,
        },
        data: {
          status: "CONFIRMED",
        },
      });

      return {
        bookingId: updatedBooking.id,
        bookingReference: updatedBooking.bookingReference,
        bookingStatus: updatedBooking.status,
        paymentStatus: payment.status,
        transactionId: payment.transactionId,
      };
    });

    return NextResponse.json({
      success: true,
      message: "Payment completed successfully.",
      payment: result,
    });
  } catch (error) {
    console.error("Payment failed:", error);

    if (error instanceof Error) {
      if (error.message === "BOOKING_NOT_FOUND") {
        return NextResponse.json(
          {
            success: false,
            message: "Booking not found.",
          },
          { status: 404 },
        );
      }

      if (error.message === "BOOKING_CANCELLED") {
        return NextResponse.json(
          {
            success: false,
            message: "This booking has been cancelled.",
          },
          { status: 400 },
        );
      }

      if (error.message === "PAYMENT_NOT_FOUND") {
        return NextResponse.json(
          {
            success: false,
            message: "Payment record not found for this booking.",
          },
          { status: 404 },
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to complete payment.",
      },
      { status: 500 },
    );
  }
}
