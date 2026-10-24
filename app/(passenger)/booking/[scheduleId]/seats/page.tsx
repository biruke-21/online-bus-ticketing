"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type Seat = {
  id: string;
  seatNumber: string;
  status: "AVAILABLE" | "BOOKED" | "BLOCKED";
};

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

export default function SeatSelectionPage() {
  const params = useParams<{ scheduleId: string }>();
  const scheduleId = params.scheduleId;

  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!scheduleId) {
      setError("Schedule ID could not be found.");
      setLoading(false);
      return;
    }

    async function loadSeats() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/booking/${scheduleId}/seats`,
          {
            cache: "no-store",
          },
        );

        const data: SeatsResponse = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to load seat information.",
          );
        }

        setSchedule(data.schedule ?? null);
        setSeats(data.seats ?? []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load this bus.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadSeats();
  }, [scheduleId]);

  const selectedSeatObjects = useMemo(() => {
    return seats.filter((seat) =>
      selectedSeats.includes(seat.id),
    );
  }, [seats, selectedSeats]);

  const totalPrice =
    selectedSeats.length * Number(schedule?.price ?? 0);

  function toggleSeat(seat: Seat) {
    if (seat.status !== "AVAILABLE") {
      return;
    }

    setSelectedSeats((current) => {
      if (current.includes(seat.id)) {
        return current.filter((id) => id !== seat.id);
      }

      return [...current, seat.id];
    });
  }

  function continueBooking() {
    if (!scheduleId) {
      setError("Schedule ID could not be found.");
      return;
    }

    if (selectedSeats.length === 0) {
      setError("Please select at least one seat.");
      return;
    }

    const storageKey =
      `busgo-selected-seats-${scheduleId}`;

    sessionStorage.setItem(
      storageKey,
      JSON.stringify(selectedSeats),
    );

    const savedSeats =
      sessionStorage.getItem(storageKey);

    if (!savedSeats) {
      setError(
        "Unable to save your selected seats. Please try again.",
      );
      return;
    }

    window.location.href =
      `/booking/${scheduleId}/passenger`;
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-10 text-center shadow-sm">
          <p className="font-medium text-slate-700">
            Loading available seats...
          </p>
        </div>
      </main>
    );
  }

  if (error || !schedule) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-red-700">
            Unable to load seats
          </h1>

          <p className="mt-3 text-slate-600">
            {error || "Schedule information could not be loaded."}
          </p>

          <button
            type="button"
            onClick={() => window.history.back()}
            className="mt-6 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white"
          >
            Go back
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-6xl px-4 py-10">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="mb-6 text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          ← Back to search
        </button>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            BusGo
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Select your seats
          </h1>

          <p className="mt-2 text-slate-600">
            Choose your preferred available seats.
          </p>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {schedule.busName}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {schedule.origin} → {schedule.destination}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Departure: {formatTime(schedule.departureTime)}
              </p>
            </div>

            <div className="mb-6 flex flex-wrap justify-center gap-5 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-5 w-5 rounded-md border border-slate-300 bg-white" />
                <span className="text-slate-600">
                  Available
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="h-5 w-5 rounded-md bg-blue-600" />
                <span className="text-slate-600">
                  Selected
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="h-5 w-5 rounded-md bg-red-500" />
                <span className="text-slate-600">
                  Booked
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="h-5 w-5 rounded-md bg-slate-400" />
                <span className="text-slate-600">
                  Blocked
                </span>
              </div>
            </div>

            <div className="mx-auto max-w-md">
              <div className="mb-6 rounded-t-[3rem] border border-slate-300 bg-slate-100 px-6 py-4 text-center">
                <span className="text-sm font-semibold text-slate-600">
                  FRONT OF BUS
                </span>
              </div>

              <div className="space-y-3">
                {Array.from(
                  {
                    length: Math.ceil(seats.length / 4),
                  },
                  (_, rowIndex) => {
                    const rowSeats = seats.slice(
                      rowIndex * 4,
                      rowIndex * 4 + 4,
                    );

                    return (
                      <div
                        key={rowIndex}
                        className="grid grid-cols-[1fr_1fr_28px_1fr_1fr] gap-2"
                      >
                        {rowSeats.map((seat, index) => {
                          const isSelected =
                            selectedSeats.includes(seat.id);

                          const statusClass =
                            seat.status === "BOOKED"
                              ? "cursor-not-allowed border-red-200 bg-red-500 text-white"
                              : seat.status === "BLOCKED"
                                ? "cursor-not-allowed border-slate-400 bg-slate-400 text-white"
                                : isSelected
                                  ? "border-blue-700 bg-blue-600 text-white shadow-md"
                                  : "border-slate-300 bg-white text-slate-700 hover:border-blue-500 hover:bg-blue-50";

                          return (
                            <div
                              key={seat.id}
                              className={
                                index === 2 ? "hidden" : ""
                              }
                            >
                              <button
                                type="button"
                                disabled={
                                  seat.status !== "AVAILABLE"
                                }
                                onClick={() =>
                                  toggleSeat(seat)
                                }
                                className={`flex h-12 w-full items-center justify-center rounded-xl border text-sm font-bold transition ${statusClass}`}
                              >
                                {seat.seatNumber}
                              </button>
                            </div>
                          );
                        })}

                        {rowSeats.length === 4 && (
                          <div className="pointer-events-none col-start-3 row-start-1" />
                        )}
                      </div>
                    );
                  },
                )}
              </div>

              <div className="mt-6 rounded-b-[2rem] border border-t-0 border-slate-300 bg-slate-100 px-6 py-4 text-center">
                <span className="text-sm font-semibold text-slate-500">
                  REAR
                </span>
              </div>
            </div>
          </div>

          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-6">
            <h2 className="text-xl font-bold text-slate-900">
              Booking summary
            </h2>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-sm text-slate-500">
                  Route
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {schedule.origin} → {schedule.destination}
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
                  Price per seat
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {formatPrice(Number(schedule.price))} ETB
                </p>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-slate-500">
                  Selected seats
                </p>

                {selectedSeatObjects.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedSeatObjects.map((seat) => (
                      <span
                        key={seat.id}
                        className="rounded-lg bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700"
                      >
                        {seat.seatNumber}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-slate-400">
                    No seats selected
                  </p>
                )}
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">
                    {selectedSeats.length} seat
                    {selectedSeats.length === 1 ? "" : "s"}
                  </span>

                  <span className="text-2xl font-bold text-slate-900">
                    {formatPrice(totalPrice)} ETB
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={selectedSeats.length === 0}
                onClick={continueBooking}
                className="w-full rounded-xl bg-blue-600 px-5 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue
              </button>

              {error && (
                <div className="rounded-xl bg-red-50 p-3 text-center text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}