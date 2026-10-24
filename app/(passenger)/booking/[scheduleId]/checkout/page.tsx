"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

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

type Passenger = {
  fullName: string;
  phone: string;
  email: string;
  identification: string;
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export default function CheckoutPage() {
  const pathname = usePathname();

  const pathParts = pathname.split("/").filter(Boolean);
  const scheduleId = pathParts[1];

  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [passenger, setPassenger] = useState<Passenger | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!scheduleId) {
      setError("Booking information could not be found.");
      setLoading(false);
      return;
    }

    async function loadCheckout() {
      try {
        const storedSeats = sessionStorage.getItem(
          `busgo-selected-seats-${scheduleId}`,
        );

        const storedPassenger = sessionStorage.getItem(
          `busgo-passenger-${scheduleId}`,
        );

        if (!storedSeats) {
          throw new Error(
            "No seats were selected. Please return to seat selection.",
          );
        }

        if (!storedPassenger) {
          throw new Error(
            "Passenger details were not found. Please return to passenger details.",
          );
        }

        const selectedSeatIds: string[] = JSON.parse(storedSeats);

        const passengerData: Passenger = JSON.parse(storedPassenger);

        const response = await fetch(
          `/api/booking/${scheduleId}/seats`,
          {
            cache: "no-store",
          },
        );

        const data: SeatsResponse = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to load booking information.",
          );
        }

        const selectedSeats = (data.seats ?? []).filter((seat) =>
          selectedSeatIds.includes(seat.id),
        );

        if (selectedSeats.length === 0) {
          throw new Error(
            "The selected seats could not be found. Please return to seat selection.",
          );
        }

        setSchedule(data.schedule ?? null);
        setSeats(selectedSeats);
        setPassenger(passengerData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load checkout information.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadCheckout();
  }, [scheduleId]);

  function goBack() {
    window.location.href = `/booking/${scheduleId}/passenger`;
  }

  async function handleConfirmBooking() {
  try {
    setError("");

    const storedSeats = sessionStorage.getItem(
      `busgo-selected-seats-${scheduleId}`,
    );

    const storedPassenger = sessionStorage.getItem(
      `busgo-passenger-${scheduleId}`,
    );

    if (!storedSeats || !storedPassenger) {
      setError(
        "Your booking information is missing. Please return and select your seats again.",
      );
      return;
    }

    const seatIds: string[] = JSON.parse(storedSeats);
    const passenger = JSON.parse(storedPassenger);

    if (seatIds.length === 0) {
      setError("Please select at least one seat.");
      return;
    }

    const response = await fetch("/api/booking", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        scheduleId,
        seatIds,
        passenger,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      setError(
        data.message || "Unable to create your booking.",
      );
      return;
    }

   if (!response.ok || !data.success) {
  setError(
    data.message || "Unable to create your booking.",
  );
  return;
}

sessionStorage.setItem(
  `busgo-booking-${data.booking.id}`,
  JSON.stringify(data.booking),
);

window.location.href = `/payment/${data.booking.id}`;
  } catch (error) {
    console.error("Booking creation failed:", error);

    setError(
      "Unable to create your booking. Please try again.",
    );
  }
}

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-10 text-center shadow-sm">
          <p className="font-medium text-slate-700">
            Loading checkout...
          </p>
        </div>
      </main>
    );
  }

  if (error || !schedule || !passenger) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl">
            !
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Unable to continue
          </h1>

          <p className="mt-2 text-slate-600">
            {error || "Booking information could not be loaded."}
          </p>

          <button
            type="button"
            onClick={goBack}
            className="mt-6 rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-800"
          >
            Back to passenger details
          </button>
        </div>
      </main>
    );
  }

  const pricePerSeat = Number(schedule.price);
  const total = seats.length * pricePerSeat;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <button
          type="button"
          onClick={goBack}
          className="mb-6 text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          ← Back to passenger details
        </button>

        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
            BusGo
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Checkout
          </h1>

          <p className="mt-2 text-slate-600">
            Review your booking before confirming payment.
          </p>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {/* Trip details */}
            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">
                Trip details
              </h2>

              <div className="mt-5 rounded-xl bg-slate-50 p-5">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900">
                      {formatTime(schedule.departureTime)}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {schedule.origin}
                    </p>
                  </div>

                  <div className="flex flex-1 items-center gap-2">
                    <div className="h-px flex-1 bg-slate-300" />

                    <span className="text-lg text-slate-400">
                      →
                    </span>

                    <div className="h-px flex-1 bg-slate-300" />
                  </div>

                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900">
                      {formatTime(schedule.arrivalTime)}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {schedule.destination}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-slate-500">
                      Date
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {formatDate(schedule.departureTime)}
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
                </div>
              </div>
            </section>

            {/* Passenger details */}
            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">
                Passenger details
              </h2>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-slate-500">
                    Full name
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {passenger.fullName}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Phone number
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {passenger.phone}
                  </p>
                </div>

                {passenger.email && (
                  <div>
                    <p className="text-sm text-slate-500">
                      Email
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {passenger.email}
                    </p>
                  </div>
                )}

                {passenger.identification && (
                  <div>
                    <p className="text-sm text-slate-500">
                      Identification
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {passenger.identification}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Seats */}
            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">
                Selected seats
              </h2>

              <div className="mt-4 flex flex-wrap gap-3">
                {seats.map((seat) => (
                  <div
                    key={seat.id}
                    className="rounded-xl bg-blue-50 px-4 py-3 font-bold text-blue-700"
                  >
                    Seat {seat.seatNumber}
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Order summary */}
          <aside className="h-fit rounded-2xl bg-white p-6 shadow-sm lg:sticky lg:top-6">
            <h2 className="text-xl font-bold text-slate-900">
              Booking summary
            </h2>

            <div className="mt-6 space-y-4">
              <div className="flex justify-between gap-4">
                <span className="text-slate-600">
                  Ticket price
                </span>

                <span className="font-semibold text-slate-900">
                  {formatPrice(pricePerSeat)} ETB
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-600">
                  Number of seats
                </span>

                <span className="font-semibold text-slate-900">
                  {seats.length}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-600">
                  Seats
                </span>

                <span className="font-semibold text-slate-900">
                  {seats.map((seat) => seat.seatNumber).join(", ")}
                </span>
              </div>

              <div className="border-t border-slate-200 pt-5">
                <div className="flex items-end justify-between gap-4">
                  <span className="font-semibold text-slate-700">
                    Total
                  </span>

                  <span className="text-2xl font-bold text-blue-600">
                    {formatPrice(total)} ETB
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-blue-50 p-4">
              <p className="text-sm font-medium text-blue-900">
                Payment
              </p>

              <p className="mt-1 text-sm text-blue-700">
                Your payment method will be selected on the next step.
              </p>
            </div>

            <button
              type="button"
              onClick={handleConfirmBooking}
              className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-4 font-bold text-white transition hover:bg-blue-700"
            >
              Continue to payment
            </button>

            <p className="mt-4 text-center text-xs leading-5 text-slate-500">
              Please review your trip, passenger information, and
              selected seats before continuing.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}