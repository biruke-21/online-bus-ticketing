"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Schedule = {
  id: string;
  busName: string;
  plateNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  price: string;
};

type Seat = {
  id: string;
  seatNumber: string;
};

type SeatsResponse = {
  success: boolean;
  schedule?: Schedule;
  seats?: Seat[];
  message?: string;
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export default function PassengerDetailsPage() {
  const params = useParams<{ scheduleId: string }>();

  const scheduleId = params.scheduleId;

  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [identification, setIdentification] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!scheduleId) {
      setError("Booking ID could not be found.");
      setLoading(false);
      return;
    }

    async function loadBooking() {
      try {
        const storedSeats = sessionStorage.getItem(
          `busgo-selected-seats-${scheduleId}`,
        );

        if (!storedSeats) {
          throw new Error(
            "No seats were selected. Please return to seat selection.",
          );
        }

        const selectedSeatIds: string[] = JSON.parse(storedSeats);

        if (
          !Array.isArray(selectedSeatIds) ||
          selectedSeatIds.length === 0
        ) {
          throw new Error(
            "No seats were selected. Please return to seat selection.",
          );
        }

        const response = await fetch(
          `/api/booking/${scheduleId}/seats`,
          {
            cache: "no-store",
          },
        );

        const data: SeatsResponse = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Unable to load booking information.",
          );
        }

        setSchedule(data.schedule ?? null);

        const selectedSeats = (data.seats ?? []).filter(
          (seat) => selectedSeatIds.includes(seat.id),
        );

        if (selectedSeats.length === 0) {
          throw new Error(
            "The selected seats could not be found. Please return to seat selection.",
          );
        }

        setSeats(selectedSeats);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load booking information.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadBooking();
  }, [scheduleId]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!fullName.trim()) {
      setError("Please enter the passenger's full name.");
      return;
    }

    if (!phone.trim()) {
      setError("Please enter a phone number.");
      return;
    }

    if (seats.length === 0) {
      setError("No seat has been selected.");
      return;
    }

    sessionStorage.setItem(
      `busgo-passenger-${scheduleId}`,
      JSON.stringify({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        identification: identification.trim(),
      }),
    );

    window.location.href =
      `/booking/${scheduleId}/checkout`;
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-10 text-center shadow-sm">
          <p className="font-medium text-slate-700">
            Loading passenger details...
          </p>
        </div>
      </main>
    );
  }

  if (error || !schedule) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-2xl rounded-2xl bg-red-50 p-8 text-center">
          <h1 className="text-xl font-bold text-red-800">
            Unable to continue
          </h1>

          <p className="mt-2 text-red-700">
            {error ||
              "Booking information could not be loaded."}
          </p>

          <button
            type="button"
            onClick={() =>
              (window.location.href =
                `/booking/${scheduleId}/seats`)
            }
            className="mt-6 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800"
          >
            Return to seats
          </button>
        </div>
      </main>
    );
  }

  const total = seats.length * Number(schedule.price);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <button
          type="button"
          onClick={() =>
            (window.location.href =
              `/booking/${scheduleId}/seats`)
          }
          className="mb-6 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← Back to seat selection
        </button>

        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          BusGo
        </p>

        <h1 className="mt-1 text-3xl font-bold text-slate-900">
          Passenger details
        </h1>

        <p className="mt-2 text-slate-600">
          Enter the passenger information for this booking.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl bg-white p-6 shadow-sm"
          >
            <h2 className="text-xl font-bold text-slate-900">
              Passenger information
            </h2>

            {error && (
              <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="fullName"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Full name
                </label>

                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(event) =>
                    setFullName(event.target.value)
                  }
                  placeholder="Enter full name"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Phone number
                </label>

                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  placeholder="09XXXXXXXX"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Email
                  <span className="ml-1 text-slate-400">
                    (optional)
                  </span>
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="identification"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Identification number
                  <span className="ml-1 text-slate-400">
                    (optional)
                  </span>
                </label>

                <input
                  id="identification"
                  type="text"
                  value={identification}
                  onChange={(event) =>
                    setIdentification(event.target.value)
                  }
                  placeholder="ID or passport number"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-8 w-full rounded-xl bg-blue-600 px-5 py-3.5 font-semibold text-white hover:bg-blue-700"
            >
              Continue to checkout
            </button>
          </form>

          <div className="h-fit rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Booking summary
            </h2>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-sm text-slate-500">
                  Trip
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {schedule.origin} → {schedule.destination}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Bus
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {schedule.busName}
                </p>

                <p className="text-xs text-slate-500">
                  {schedule.plateNumber}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Departure
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {formatTime(schedule.departureTime)}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Selected seats
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {seats.map((seat) => (
                    <span
                      key={seat.id}
                      className="rounded-lg bg-blue-100 px-3 py-1 font-semibold text-blue-700"
                    >
                      {seat.seatNumber}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">
                    Total
                  </span>

                  <span className="text-xl font-bold text-slate-900">
                    {formatPrice(total)} ETB
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}