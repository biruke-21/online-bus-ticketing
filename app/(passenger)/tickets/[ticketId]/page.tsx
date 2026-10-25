
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

function formatDate(dateString: string): string {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString("en-ET", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatAmount(amount: string): string {
  const value = Number(amount);

  if (!Number.isFinite(value)) {
    return `${amount} ETB`;
  }

  return `${value.toLocaleString("en-ET", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ETB`;
}

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
      void loadTicket();
    } else {
      setError("Ticket ID is missing.");
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [ticketId]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />
          <p className="mt-4 text-slate-300">
            Loading your BusGo ticket...
          </p>
        </div>
      </main>
    );
  }

  if (error || !ticket) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center shadow-xl">
          <div className="text-5xl">🎫</div>

          <h1 className="mt-5 text-2xl font-bold text-white">
            Ticket unavailable
          </h1>

          <p className="mt-3 break-words text-slate-400">
            {error || "Ticket details could not be found."}
          </p>

          <button
            type="button"
            onClick={() => router.push("/search")}
            className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500"
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

  const isPaid = ticket.paymentStatus.toUpperCase() === "PAID";

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-4xl">
        {/* Confirmation heading */}
        <header className="mb-8 text-center print:hidden">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10 text-3xl font-bold text-emerald-400">
            ✓
          </div>

          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Booking confirmed
          </h1>

          <p className="mt-3 text-slate-400">
            Your BusGo digital ticket is ready.
          </p>
        </header>

        {/* Ticket */}
        <article
          id="busgo-ticket"
          className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl print:rounded-xl print:border-slate-300 print:shadow-none"
        >
          {/* Brand header */}
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 px-6 py-8 text-white sm:px-9">
            <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full border-[24px] border-white/10" />
            <div className="pointer-events-none absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-white/5" />

            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl font-black text-blue-700">
                    B
                  </div>

                  <div>
                    <p className="text-xl font-extrabold tracking-wide">
                      BusGo
                    </p>
                    <p className="text-xs font-medium text-blue-100">
                      YOUR JOURNEY, OUR PRIORITY
                    </p>
                  </div>
                </div>

                <p className="mt-7 text-xs font-bold uppercase tracking-[0.2em] text-blue-100">
                  Digital bus ticket
                </p>

                <h2 className="mt-2 break-all text-3xl font-extrabold sm:text-4xl">
                  {ticket.ticketNumber}
                </h2>

                <p className="mt-3 text-sm text-blue-100">
                  Booking reference:{" "}
                  <span className="font-bold text-white">
                    {ticket.bookingReference}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-3 self-start rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm sm:min-w-36 sm:flex-col sm:items-center sm:justify-center">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    isPaid
                      ? "bg-emerald-400/20 text-emerald-200"
                      : "bg-amber-400/20 text-amber-200"
                  }`}
                >
                  {isPaid ? "✓" : "!"}
                </span>

                <div className="sm:text-center">
                  <p className="text-xs uppercase tracking-wider text-blue-100">
                    Payment status
                  </p>
                  <p className="mt-1 font-extrabold text-white">
                    {ticket.paymentStatus}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-9">
            {/* Passenger and bus details */}
            <section className="grid gap-7 sm:grid-cols-2">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700">
                  Passenger information
                </p>

                <h3 className="mt-3 break-words text-xl font-extrabold text-slate-900">
                  {ticket.passenger?.fullName || "Not provided"}
                </h3>

                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <p className="break-words">
                    <span className="font-semibold text-slate-800">
                      Phone:
                    </span>{" "}
                    {ticket.passenger?.phone || "Not provided"}
                  </p>

                  <p className="break-all">
                    <span className="font-semibold text-slate-800">
                      Email:
                    </span>{" "}
                    {ticket.passenger?.email || "Not provided"}
                  </p>
                </div>
              </div>

              <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700">
                  Bus information
                </p>

                <h3 className="mt-3 break-words text-xl font-extrabold text-slate-900">
                  {ticket.trip.busName}
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  Plate number:{" "}
                  <span className="font-bold text-slate-900">
                    {ticket.trip.plateNumber}
                  </span>
                </p>
              </div>
            </section>

            {/* Route */}
            <section className="mt-8 rounded-2xl border border-blue-100 bg-blue-50/70 p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700">
                  Your journey
                </p>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-100">
                  Bus trip
                </span>
              </div>

              <div className="grid gap-6 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-500">
                    FROM
                  </p>
                  <h3 className="mt-2 break-words text-xl font-extrabold text-slate-900 sm:text-2xl">
                    {ticket.trip.origin}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {formatDate(ticket.trip.departureTime)}
                  </p>
                </div>

                <div className="hidden text-2xl text-blue-600 sm:block">
                  →
                </div>

                <div className="min-w-0 sm:text-right">
                  <p className="text-sm font-medium text-slate-500">
                    TO
                  </p>
                  <h3 className="mt-2 break-words text-xl font-extrabold text-slate-900 sm:text-2xl">
                    {ticket.trip.destination}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {formatDate(ticket.trip.arrivalTime)}
                  </p>
                </div>
              </div>
            </section>

            {/* Seat and payment summary */}
            <section className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Seat number(s)
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {ticket.seats.length > 0 ? (
                    ticket.seats.map((seat) => (
                      <span
                        key={seat.id}
                        className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 font-extrabold text-blue-800"
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

              <div className="rounded-2xl border border-slate-200 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Payment
                </p>

                <span
                  className={`mt-3 inline-flex rounded-full px-3 py-1.5 text-sm font-bold ${
                    isPaid
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {ticket.paymentStatus}
                </span>
              </div>

              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
                  Total amount
                </p>

                <p className="mt-3 break-words text-2xl font-extrabold text-slate-900">
                  {formatAmount(ticket.totalAmount)}
                </p>
              </div>
            </section>

            {/* QR code and ticket reference */}
            <section className="mt-8 grid gap-6 rounded-2xl border-2 border-dashed border-slate-200 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Your boarding QR code
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Keep this ticket available and present the QR code to
                  authorized staff when boarding.
                </p>

                <div className="mt-4 space-y-2 text-sm">
                  <p className="break-all">
                    <span className="font-semibold text-slate-700">
                      Ticket:
                    </span>{" "}
                    <span className="font-bold text-blue-700">
                      {ticket.ticketNumber}
                    </span>
                  </p>

                  <p className="break-all">
                    <span className="font-semibold text-slate-700">
                      Reference:
                    </span>{" "}
                    {ticket.bookingReference}
                  </p>
                </div>
              </div>

              <div className="mx-auto rounded-2xl border border-slate-200 bg-white p-3">
                <QRCodeSVG
                  value={qrCodeData}
                  size={160}
                  level="H"
                  includeMargin
                  title={`QR code for ticket ${ticket.ticketNumber}`}
                  aria-label="Ticket QR code"
                />
              </div>
            </section>

            {/* Boarding instructions */}
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm leading-6 text-amber-900">
                <strong>Important:</strong> Please arrive before your
                departure time. Keep your ticket and booking reference
                ready when boarding.
              </p>
            </div>

            {/* Action buttons */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 rounded-xl bg-blue-700 px-5 py-3.5 font-bold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-600"
              >
                Print ticket / Save as PDF
              </button>

              <button
                type="button"
                onClick={() => router.push("/search")}
                className="flex-1 rounded-xl border border-slate-300 bg-white px-5 py-3.5 font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
              >
                Book another trip
              </button>
            </div>

            <footer className="mt-8 border-t border-slate-200 pt-5 text-center">
              <p className="text-sm font-extrabold text-blue-700">
                Thank you for choosing BusGo!
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Travel safely. We look forward to serving you again.
              </p>
            </footer>
          </div>
        </article>
      </div>

      {/* Ticket-only print layout */}
<style jsx global>{`
  @media print {
    @page {
      size: A4 portrait;
      margin: 7mm;
    }

    html,
    body {
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
    }

    body * {
      visibility: hidden !important;
    }

    #busgo-ticket,
    #busgo-ticket * {
      visibility: visible !important;
    }

    #busgo-ticket {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      max-width: none !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: visible !important;
      border: 1px solid #cbd5e1 !important;
      border-radius: 8px !important;
      box-shadow: none !important;
      background: white !important;
      font-size: 10px !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    #busgo-ticket .bg-gradient-to-r {
      background: #1d4ed8 !important;
      color: white !important;
    }

    #busgo-ticket .text-white {
      color: white !important;
    }

    #busgo-ticket .text-blue-100 {
      color: #dbeafe !important;
    }

    #busgo-ticket .p-6,
    #busgo-ticket .sm\\:p-9 {
      padding: 12px !important;
    }

    #busgo-ticket .px-6,
    #busgo-ticket .sm\\:px-9 {
      padding-left: 14px !important;
      padding-right: 14px !important;
    }

    #busgo-ticket .py-8 {
      padding-top: 12px !important;
      padding-bottom: 12px !important;
    }

    #busgo-ticket .mt-8 {
      margin-top: 12px !important;
    }

    #busgo-ticket .mt-7 {
      margin-top: 10px !important;
    }

    #busgo-ticket .mt-6 {
      margin-top: 10px !important;
    }

    #busgo-ticket .mt-5 {
      margin-top: 8px !important;
    }

    #busgo-ticket .mt-4 {
      margin-top: 6px !important;
    }

    #busgo-ticket .gap-7,
    #busgo-ticket .gap-6 {
      gap: 12px !important;
    }

    #busgo-ticket .text-4xl {
      font-size: 23px !important;
    }

    #busgo-ticket .text-3xl {
      font-size: 20px !important;
    }

    #busgo-ticket .text-2xl {
      font-size: 17px !important;
    }

    #busgo-ticket .text-xl {
      font-size: 15px !important;
    }

    #busgo-ticket section,
    #busgo-ticket footer {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    #busgo-ticket .bg-blue-50,
    #busgo-ticket .bg-blue-50\\/70 {
      background: #eff6ff !important;
    }

    #busgo-ticket .bg-slate-50 {
      background: #f8fafc !important;
    }

    #busgo-ticket svg {
      max-width: 120px !important;
      max-height: 120px !important;
    }

    #busgo-ticket button,
    .print\\:hidden {
      display: none !important;
    }
  }
`}</style>

    </main>
  );
}

