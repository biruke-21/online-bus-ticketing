"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type BookingData = {
  id: string;
  bookingReference: string;
  status: string;
  totalAmount: string;
};

type TicketResponse = {
  success?: boolean;
  message?: string;
  ticket?: {
    id: string;
    ticketNumber: string;
  };
};

export default function PaymentPage() {
  const params = useParams<{ bookingId: string }>();
  const router = useRouter();

  const bookingId = params.bookingId;

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [error, setError] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    const storedBooking = sessionStorage.getItem(
      `busgo-booking-${bookingId}`,
    );

    if (!storedBooking) {
      setError(
        "Booking information could not be found. Please return to the booking page.",
      );
      return;
    }

    try {
      const parsedBooking = JSON.parse(
        storedBooking,
      ) as BookingData;

      setBooking(parsedBooking);

      if (parsedBooking.status === "CONFIRMED") {
        setPaymentSuccess(true);
      }
    } catch (error) {
      console.error("Failed to read booking:", error);
      setError("Unable to read booking information.");
    }
  }, [bookingId]);

  async function createTicket() {
    const ticketResponse = await fetch("/api/ticket", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bookingId,
      }),
    });

    const ticketText = await ticketResponse.text();

    let ticketData: TicketResponse;

    try {
      ticketData = JSON.parse(ticketText);
    } catch (error) {
      console.error(
        "Ticket API returned non-JSON:",
        ticketText,
      );

      throw new Error(
        "The ticket service returned an unexpected response.",
      );
    }

    if (!ticketResponse.ok || !ticketData.success) {
      throw new Error(
        ticketData.message ||
          "Payment succeeded, but we could not create your ticket.",
      );
    }

    if (!ticketData.ticket?.id) {
      throw new Error(
        "Ticket was created, but no ticket ID was returned.",
      );
    }

    router.push(`/tickets/${ticketData.ticket.id}`);
  }

  async function handleTestPayment() {
    if (!booking || isPaying) {
      return;
    }

    try {
      setError("");
      setIsPaying(true);

      /*
       * If payment has not been completed yet,
       * complete the payment first.
       */
      if (booking.status !== "CONFIRMED") {
        const response = await fetch("/api/payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bookingId,
          }),
        });

        const responseText = await response.text();

        let data: {
          success?: boolean;
          message?: string;
          payment?: {
            bookingStatus?: string;
          };
        };

        try {
          data = JSON.parse(responseText);
        } catch (error) {
          console.error(
            "Payment API returned non-JSON:",
            responseText,
          );

          throw new Error(
            "The payment service returned an unexpected response.",
          );
        }

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to complete payment.",
          );
        }

        const updatedBooking: BookingData = {
          ...booking,
          status:
            data.payment?.bookingStatus || "CONFIRMED",
        };

        sessionStorage.setItem(
          `busgo-booking-${bookingId}`,
          JSON.stringify(updatedBooking),
        );

        setBooking(updatedBooking);
      }

      /*
       * Payment is now confirmed.
       * Create or retrieve the digital ticket.
       */
      await createTicket();
    } catch (error) {
      console.error("Payment/ticket process failed:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to complete payment. Please try again.",
      );

      /*
       * If payment already succeeded, show the confirmed
       * state so the user can retry ticket creation.
       */
      if (booking) {
        const storedBooking = sessionStorage.getItem(
          `busgo-booking-${bookingId}`,
        );

        if (storedBooking) {
          try {
            const parsedBooking = JSON.parse(
              storedBooking,
            ) as BookingData;

            setBooking(parsedBooking);

            if (parsedBooking.status === "CONFIRMED") {
              setPaymentSuccess(true);
            }
          } catch {
            // Keep the existing booking state.
          }
        }
      }
    } finally {
      setIsPaying(false);
    }
  }

  if (error && !booking) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">
            Payment
          </h1>

          <p className="mt-4 text-red-600">{error}</p>

          <button
            type="button"
            onClick={() => router.push("/search")}
            className="mt-6 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Search for another trip
          </button>
        </div>
      </main>
    );
  }

  if (!booking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-600">
          Loading payment...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            BusGo Payment
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Complete your payment
          </h1>

          <p className="mt-2 text-slate-600">
            {paymentSuccess
              ? "Your payment has been completed successfully."
              : "Your booking has been created and is waiting for payment."}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <div className="border-b border-slate-200 pb-6">
            <p className="text-sm text-slate-500">
              Booking reference
            </p>

            <p className="mt-1 text-xl font-bold text-slate-900">
              {booking.bookingReference}
            </p>
          </div>

          <div className="flex items-center justify-between border-b border-slate-200 py-6">
            <div>
              <p className="text-sm text-slate-500">
                Booking status
              </p>

              <span
                className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                  booking.status === "CONFIRMED"
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {booking.status}
              </span>
            </div>

            <div className="text-right">
              <p className="text-sm text-slate-500">
                {paymentSuccess
                  ? "Amount paid"
                  : "Amount to pay"}
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {booking.totalAmount} ETB
              </p>
            </div>
          </div>

          {!paymentSuccess && (
            <div className="py-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Payment method
              </h2>

              <div className="mt-4 rounded-xl border-2 border-blue-600 bg-blue-50 p-4">
                <p className="font-semibold text-slate-900">
                  Test Payment
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  This is a temporary payment method for
                  testing the BusGo booking flow.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {paymentSuccess ? (
            <div className="rounded-xl border border-green-200 bg-green-50 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white">
                  ✓
                </div>

                <div>
                  <h2 className="font-semibold text-green-800">
                    Payment successful
                  </h2>

                  <p className="mt-1 text-sm text-green-700">
                    Your booking is now confirmed.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTestPayment}
                disabled={isPaying}
                className="mt-5 w-full rounded-xl bg-green-600 px-5 py-4 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPaying
                  ? "Creating ticket..."
                  : "View your ticket"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleTestPayment}
              disabled={isPaying}
              className="w-full rounded-xl bg-blue-600 px-5 py-4 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPaying
                ? "Processing payment..."
                : `Pay ${booking.totalAmount} ETB`}
            </button>
          )}

          {!paymentSuccess && (
            <p className="mt-4 text-center text-xs text-slate-500">
              Your booking will remain pending until payment
              is completed.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}