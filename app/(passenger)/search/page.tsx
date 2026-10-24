"use client";

import { FormEvent, useState } from "react";

type SearchResult = {
id: string;
busName: string;
plateNumber: string;
origin: string;
destination: string;
departureTime: string;
arrivalTime: string;
price: string;
availableSeats: number;
};

type SearchResponse = {
success: boolean;
results?: SearchResult[];
message?: string;
};

const locations = [
"Addis Ababa",
"Adama",
"Bahir Dar",
"Dessie",
"Gondar",
"Hawassa",
"Jimma",
];

function formatTime(value: string) {
return new Intl.DateTimeFormat("en-US", {
hour: "2-digit",
minute: "2-digit",
hour12: true,
}).format(new Date(value));
}

function formatPrice(value: string) {
return new Intl.NumberFormat("en-US").format(Number(value));
}

export default function SearchPage() {
const [origin, setOrigin] = useState("");
const [destination, setDestination] = useState("");
const [date, setDate] = useState("");
const [results, setResults] = useState<SearchResult[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");
const [hasSearched, setHasSearched] = useState(false);

async function handleSearch(event: FormEvent<HTMLFormElement>) {
event.preventDefault();

setError("");
setResults([]);

if (!origin || !destination || !date) {
  setHasSearched(false);
  setError(
    "Please select your departure, destination, and travel date.",
  );
  return;
}

if (origin === destination) {
  setHasSearched(false);
  setError("Departure and destination cannot be the same.");
  return;
}

try {
  setLoading(true);
  setHasSearched(true);

  const params = new URLSearchParams({
    origin,
    destination,
    date,
  });

  const response = await fetch(
    `/api/search?${params.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  const data: SearchResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(
      data.message || "Unable to search for buses.",
    );
  }

  setResults(data.results ?? []);
} catch (err) {
  setHasSearched(false);

  setError(
    err instanceof Error
      ? err.message
      : "Something went wrong while searching.",
  );
} finally {
  setLoading(false);
}

}

return (
<main className="min-h-screen bg-slate-50">
<section className="border-b bg-white">
<div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
<div className="mb-8">
<p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-600">
BusGo
</p>

        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Find your bus
        </h1>

        <p className="mt-2 text-slate-600">
          Search available buses and choose the trip that works best
          for you.
        </p>
      </div>

      <form
        onSubmit={handleSearch}
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
      >
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label
              htmlFor="origin"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              From
            </label>

            <select
              id="origin"
              value={origin}
              onChange={(event) => {
                setOrigin(event.target.value);
                setHasSearched(false);
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Select departure</option>

              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="destination"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              To
            </label>

            <select
              id="destination"
              value={destination}
              onChange={(event) => {
                setDestination(event.target.value);
                setHasSearched(false);
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Select destination</option>

              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="date"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Travel date
            </label>

            <input
              id="date"
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                setHasSearched(false);
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Searching..." : "Search buses"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </form>
    </div>
  </section>

  <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
    {loading && (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="font-medium text-slate-700">
          Searching for available buses...
        </p>
      </div>
    )}

    {!loading && results.length > 0 && (
      <div>
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-slate-900">
            Available buses
          </h2>

          <p className="mt-1 text-slate-600">
            {results.length} trip
            {results.length === 1 ? "" : "s"} found for {origin} to{" "}
            {destination}.
          </p>
        </div>

        <div className="space-y-4">
          {results.map((result) => (
            <article
              key={result.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
            >
              <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-bold text-slate-900">
                      {result.busName}
                    </h3>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {result.plateNumber}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-5 sm:grid-cols-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Departure
                      </p>

                      <p className="mt-1 text-lg font-bold text-slate-900">
                        {formatTime(result.departureTime)}
                      </p>

                      <p className="text-sm text-slate-600">
                        {result.origin}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Arrival
                      </p>

                      <p className="mt-1 text-lg font-bold text-slate-900">
                        {formatTime(result.arrivalTime)}
                      </p>

                      <p className="text-sm text-slate-600">
                        {result.destination}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Seats available
                      </p>

                      <p className="mt-1 text-lg font-bold text-green-600">
                        {result.availableSeats}
                      </p>

                      <p className="text-sm text-slate-600">
                        seats remaining
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                  <p className="text-sm text-slate-500">
                    Ticket price
                  </p>

                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {formatPrice(result.price)} ETB
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = `/booking/${result.id}/seats`;
                    }}
                    className="mt-4 w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
                  >
                    Select bus
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    )}

    {!loading && hasSearched && !error && results.length === 0 && (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center">
        <h2 className="text-xl font-bold text-slate-900">
          No buses found
        </h2>

        <p className="mt-2 text-slate-600">
          We could not find a bus for this route and date. Try another
          date or route.
        </p>
      </div>
    )}

    {!loading && !hasSearched && (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
        <h2 className="text-xl font-bold text-slate-900">
          Search for your trip
        </h2>

        <p className="mt-2 text-slate-600">
          Select your departure, destination, and travel date to see
          available buses.
        </p>
      </div>
    )}
  </section>
</main>

);
}