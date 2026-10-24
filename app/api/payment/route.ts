import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

type PaymentRequest = {
  bookingId?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PaymentRequest;

    const bookingId = body.bookingId;

    if (!bookingId) {
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

      if (booking.payment.status === "PAID") {
        return {
          bookingId: booking.id,
          bookingReference: booking.bookingReference,
          bookingStatus: booking.status,
          paymentStatus: booking.payment.status,
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