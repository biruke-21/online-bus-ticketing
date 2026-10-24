
"use client";

import { FormEvent, useState } from "react";

type VerificationResult = {
  success: boolean;
  valid: boolean;
  message: string;
  ticket?: {
    ticketNumber: string;
    bookingReference: string;
    passengerName?: string;
    busName?: string;
    plateNumber?: string;
    origin?: string;
    destination?: string;
    departureTime?: string;
    paymentStatus?: string;
    bookingStatus?: string;
    totalAmount?: string;
  };
};

export default function VerifyTicketPage() {
  const [ticketNumber, setTicketNumber] = useState("");
  const [bookingReference, setBookingReference] = useState("");
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setResult(null);
    setError("");

    try {
      const response = await fetch("/api/verify-ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticketNumber: ticketNumber.trim(),
          bookingReference: bookingReference.trim(),
        }),
      });

      const data: VerificationResult = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Unable to verify the ticket.");
        return;
      }

      setResult(data);
    } catch {
      setError(
        "Could not connect to the server. Please check that BusGo is running.",
      );
    } finally {
      setLoading(false);
    }
  }

  function formatDeparture(value?: string) {
    if (!value) return "Not available";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-white sm:px-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/15 text-3xl">
            🎫
          </div>

          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-blue-400">
            BusGo Staff Portal
          </p>

          <h1 className="text-3xl font-bold sm:text-4xl">
            Ticket Verification
          </h1>

          <p className="mt-3 text-slate-400">
            Check a passenger&apos;s ticket against the booking database.
          </p>
        </div>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8">
          <form onSubmit={handleVerify} className="space-y-5">
            <div>
              <label
                htmlFor="ticketNumber"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Ticket Number
              </label>

              <input
                id="ticketNumber"
                type="text"
                value={ticketNumber}
                onChange={(event) => setTicketNumber(event.target.value)}
                placeholder="e.g. BUS-D2AF1C7C"
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label
                htmlFor="bookingReference"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Booking Reference
              </label>

              <input
                id="bookingReference"
                type="text"
                value={bookingReference}
                onChange={(event) => setBookingReference(event.target.value)}
                placeholder="e.g. BG-A290B03EB7"
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-5 py-3.5 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Checking Ticket..." : "Verify Ticket"}
            </button>
          </form>
        </section>

        {result && (
          <section
            aria-live="polite"
            className={`mt-6 overflow-hidden rounded-2xl border ${
              result.valid
                ? "border-emerald-500/40 bg-emerald-500/5"
                : "border-red-500/40 bg-red-500/5"
            }`}
          >
            <div
              className={`p-5 ${
                result.valid ? "bg-emerald-500/10" : "bg-red-500/10"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl" aria-hidden="true">
                  {result.valid ? "✓" : "✕"}
                </span>

                <div>
                  <h2
                    className={`text-xl font-bold ${
                      result.valid ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {result.valid ? "VALID TICKET" : "INVALID TICKET"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-300">
                    {result.message}
                  </p>
                </div>
              </div>
            </div>

            {result.ticket && (
              <div className="space-y-4 p-5">
                <h3 className="font-semibold text-white">
                  Ticket Information
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Detail
                    label="Ticket Number"
                    value={result.ticket.ticketNumber}
                  />

                  <Detail
                    label="Booking Reference"
                    value={result.ticket.bookingReference}
                  />

                  <Detail
                    label="Passenger"
                    value={result.ticket.passengerName}
                  />

                  <Detail
                    label="Bus"
                    value={result.ticket.busName}
                  />

                  <Detail
                    label="Plate Number"
                    value={result.ticket.plateNumber}
                  />

                  <Detail
                    label="Route"
                    value={
                      result.ticket.origin && result.ticket.destination
                        ? `${result.ticket.origin} → ${result.ticket.destination}`
                        : undefined
                    }
                  />

                  <Detail
                    label="Departure"
                    value={formatDeparture(result.ticket.departureTime)}
                  />

                  <Detail
                    label="Payment"
                    value={result.ticket.paymentStatus}
                  />

                  <Detail
                    label="Booking Status"
                    value={result.ticket.bookingStatus}
                  />

                  <Detail
                    label="Total Amount"
                    value={
                      result.ticket.totalAmount !== undefined
                        ? `${result.ticket.totalAmount} ETB`
                        : undefined
                    }
                  />
                </div>

                {result.valid && (
                  <div className="rounded-xl bg-emerald-500/10 p-4 text-center font-semibold text-emerald-300">
                    Passenger may proceed to boarding.
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        <p className="mt-8 text-center text-xs text-slate-500">
          BusGo Ticket Management System
        </p>
      </div>
    </main>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-semibold text-slate-200">
        {value || "Not available"}
      </p>
    </div>
  );
}

