
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

type TicketData = {
  id: string;
  ticketNumber: string;
  bookingReference: string;
  paymentStatus: string;
  totalAmount: string;
  passenger: {
    fullName: string;
    phone: string;
    email: string | null;
  } | null;
  seats: {
    id: string;
    seatNumber: string;
  }[];
  trip: {
    busName: string;
    plateNumber: string;
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    price: string;
  };
};

type TicketApiResponse = {
  success?: boolean;
  message?: string;
  ticket?: TicketData;
};

export default function TicketDetailPage() {
  const params = useParams<{ ticketId: string }>();
  const router = useRouter();

  const ticketId = params.ticketId;

  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadTicket() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/ticket/${encodeURIComponent(ticketId)}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const responseText = await response.text();

        let data: TicketApiResponse;

        try {
          data = JSON.parse(responseText) as TicketApiResponse;
        } catch {
          console.error(
            "Invalid ticket API response:",
            responseText,
          );

          throw new Error(
            `The ticket API returned an invalid response (HTTP ${response.status}).`,
          );
        }

        if (!response.ok || !data.success || !data.ticket) {
          throw new Error(
            data.message || "Unable to load ticket details.",
          );
        }

        if (!cancelled) {
          setTicket(data.ticket);
        }
      } catch (err) {
        console.error("Failed to load ticket:", err);

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load ticket details.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (ticketId) {
      loadTicket();
    } else {
      setError("Ticket ID is missing.");
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [ticketId]);

  function formatDate(dateString: string) {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "Date unavailable";
    }

    return date.toLocaleString("en-ET", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-700" />
          <p className="mt-4 text-slate-600">
            Loading your ticket...
          </p>
        </div>
      </main>
    );
  }

  if (error || !ticket) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-sm">
          <div className="text-4xl">🎫</div>

          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            Ticket unavailable
          </h1>

          <p className="mt-3 break-words text-slate-600">
            {error || "Ticket details could not be found."}
          </p>

          <button
            type="button"
            onClick={() => router.push("/search")}
            className="mt-6 rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800"
          >
            Search for buses
          </button>
        </div>
      </main>
    );
  }

  const qrCodeData = JSON.stringify({
    ticketNumber: ticket.ticketNumber,
    bookingReference: ticket.bookingReference,
  });

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        {/* Confirmation heading */}
        <div className="mb-8 text-center print:hidden">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl font-bold text-green-700">
            ✓
          </div>

          <h1 className="mt-4 text-3xl font-bold text-slate-900">
            Booking confirmation
          </h1>

          <p className="mt-2 text-slate-600">
            Your digital bus ticket is ready.
          </p>
        </div>

        {/* Ticket */}
        <div
          id="busgo-ticket"
          className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 print:rounded-none print:shadow-none print:ring-0"
        >
          {/* Ticket header */}
          <div className="bg-blue-700 p-8 text-white print:bg-white print:text-slate-900">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-100 print:text-slate-500">
                  BusGo Digital Ticket
                </p>

                <h2 className="mt-3 text-3xl font-bold">
                  {ticket.ticketNumber}
                </h2>

                <p className="mt-2 break-all text-blue-100 print:text-slate-600">
                  Booking reference: {ticket.bookingReference}
                </p>
              </div>

              <div className="self-start rounded-xl bg-white p-3 text-center text-blue-800 print:border print:border-slate-200">
                <p className="text-xs font-semibold uppercase tracking-wider">
                  Payment
                </p>
                <p className="mt-1 font-bold">
                  {ticket.paymentStatus}
                </p>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Passenger and bus */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-sm text-slate-500">
                  Passenger
                </p>

                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {ticket.passenger?.fullName || "Not provided"}
                </p>

                {ticket.passenger?.phone && (
                  <p className="mt-1 text-sm text-slate-600">
                    {ticket.passenger.phone}
                  </p>
                )}

                {ticket.passenger?.email && (
                  <p className="mt-1 break-all text-sm text-slate-600">
                    {ticket.passenger.email}
                  </p>
                )}
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Bus
                </p>

                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {ticket.trip.busName}
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  Plate number: {ticket.trip.plateNumber}
                </p>
              </div>
            </div>

            <div className="my-8 border-t border-dashed border-slate-300" />

            {/* Journey details */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-sm text-slate-500">
                  From
                </p>

                <p className="mt-1 text-xl font-bold text-slate-900">
                  {ticket.trip.origin}
                </p>

                <p className="mt-2 text-sm text-slate-600">
                  Departure: {formatDate(ticket.trip.departureTime)}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  To
                </p>

                <p className="mt-1 text-xl font-bold text-slate-900">
                  {ticket.trip.destination}
                </p>

                <p className="mt-2 text-sm text-slate-600">
                  Arrival: {formatDate(ticket.trip.arrivalTime)}
                </p>
              </div>
            </div>

            <div className="my-8 border-t border-dashed border-slate-300" />

            {/* Seat and payment details */}
            <div className="grid gap-6 sm:grid-cols-3">
              <div>
                <p className="text-sm text-slate-500">
                  Seat(s)
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {ticket.seats.length > 0 ? (
                    ticket.seats.map((seat) => (
                      <span
                        key={seat.id}
                        className="rounded-lg bg-blue-100 px-3 py-2 font-bold text-blue-800 print:border print:border-slate-300 print:bg-white print:text-slate-900"
                      >
                        {seat.seatNumber}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">
                      No seats listed
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Payment status
                </p>

                <span
                  className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold print:border print:border-slate-300 print:bg-white print:text-slate-900 ${
                    ticket.paymentStatus === "PAID"
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {ticket.paymentStatus}
                </span>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Total paid
                </p>

                <p className="mt-1 text-xl font-bold text-slate-900">
                  {ticket.totalAmount} ETB
                </p>
              </div>
            </div>

            {/* QR code */}
            <div className="mt-8 flex flex-col items-center rounded-2xl border border-slate-200 bg-slate-50 p-6 print:bg-white">
              <h2 className="text-lg font-bold text-slate-900">
                Your Digital QR Code
              </h2>

              <p className="mt-2 text-center text-sm text-slate-600">
                Present this code with your ticket when boarding.
              </p>

              <div className="mt-5 rounded-xl bg-white p-4">
                <QRCodeSVG
                  value={qrCodeData}
                  size={200}
                  level="H"
                  includeMargin
                  title={`QR code for ticket ${ticket.ticketNumber}`}
                  aria-label="Ticket QR code"
                />
              </div>

              <p className="mt-4 text-sm font-semibold text-slate-700">
                {ticket.ticketNumber}
              </p>

              <p className="mt-1 break-all text-center text-xs text-slate-500">
                Booking reference: {ticket.bookingReference}
              </p>
            </div>

            {/* Boarding notice */}
            <div className="mt-8 rounded-xl bg-slate-50 p-4 print:border print:border-slate-200 print:bg-white">
              <p className="text-sm text-slate-600">
                Keep your ticket and booking reference available when
                boarding your bus. Please arrive before the departure
                time.
              </p>
            </div>

            {/* Buttons */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800"
              >
                Print ticket
              </button>

              <button
                type="button"
                onClick={() => router.push("/search")}
                className="flex-1 rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Book another trip
              </button>
            </div>

            <p className="mt-5 text-center text-xs text-slate-400 print:hidden">
              Thank you for choosing BusGo.
            </p>
          </div>
        </div>
      </div>

      {/* Print only the ticket */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }

          body {
            background: white !important;
          }

          body * {
            visibility: hidden;
          }

          #busgo-ticket,
          #busgo-ticket * {
            visibility: visible;
          }

          #busgo-ticket {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            max-width: 100%;
            margin: 0;
            overflow: visible;
          }

          #busgo-ticket .bg-blue-700 {
            background: white !important;
            color: #0f172a !important;
          }

          #busgo-ticket .text-white,
          #busgo-ticket .text-blue-100 {
            color: #0f172a !important;
          }

          #busgo-ticket .bg-slate-50 {
            background: white !important;
          }

          #busgo-ticket {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </main>
  );
}
