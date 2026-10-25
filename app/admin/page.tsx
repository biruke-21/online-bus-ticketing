
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  BusFront,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  LoaderCircle,
  QrCode,
  RefreshCw,
  Ticket,
  Users,
} from "lucide-react";

type DashboardStats = {
  totalBookings: number;
  totalRevenue: number;
  totalTickets: number;
  boardedPassengers: number;
};

type RecentBooking = {
  id: string;
  bookingReference: string;
  status: string;
  totalAmount: number;
  passengerName: string;
  passengerEmail: string;
  passengerPhone: string;
  busName: string;
  plateNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  paymentStatus: string;
  ticketNumber: string | null;
  boarded: boolean;
  createdAt: string;
};

type DashboardResponse = {
  success: boolean;
  message?: string;
  stats: DashboardStats;
  recentBookings: RecentBooking[];
};

const emptyStats: DashboardStats = {
  totalBookings: 0,
  totalRevenue: 0,
  totalTickets: 0,
  boardedPassengers: 0,
};

const statCards = [
  {
    key: "totalBookings",
    title: "Total Bookings",
    icon: ClipboardList,
    color: "bg-violet-100 text-violet-700",
    description: "All booking records",
  },
  {
    key: "totalRevenue",
    title: "Total Revenue",
    icon: Banknote,
    color: "bg-emerald-100 text-emerald-700",
    description: "Successful payments",
  },
  {
    key: "totalTickets",
    title: "Tickets Issued",
    icon: Ticket,
    color: "bg-blue-100 text-blue-700",
    description: "Generated tickets",
  },
  {
    key: "boardedPassengers",
    title: "Passengers Boarded",
    icon: Users,
    color: "bg-orange-100 text-orange-700",
    description: "Tickets already used",
  },
] as const;

const managementLinks = [
  {
    title: "Manage Buses",
    description: "View your bus fleet",
    href: "/admin/buses",
    icon: BusFront,
  },
  {
    title: "Manage Routes",
    description: "Manage destinations",
    href: "/admin/routes",
    icon: ArrowRight,
  },
  {
    title: "Manage Schedules",
    description: "Manage departure times",
    href: "/admin/schedules",
    icon: CalendarDays,
  },
  {
    title: "Manage Payments",
    description: "Review payment records",
    href: "/admin/payments",
    icon: CreditCard,
  },
];

function formatETB(amount: number) {
  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toUpperCase();

  const color =
    normalizedStatus === "PAID" ||
    normalizedStatus === "CONFIRMED" ||
    normalizedStatus === "COMPLETED"
      ? "bg-emerald-100 text-emerald-700"
      : normalizedStatus === "CANCELLED" ||
          normalizedStatus === "FAILED" ||
          normalizedStatus === "REFUNDED"
        ? "bg-red-100 text-red-700"
        : "bg-amber-100 text-amber-700";

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${color}`}
    >
      {normalizedStatus}
    </span>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/dashboard", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to load dashboard information.",
        );
      }

      setData(result as DashboardResponse);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading the dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  const stats = data?.stats ?? emptyStats;

  return (
    <main className="min-h-screen bg-slate-50 p-4 text-slate-900 sm:p-6 lg:p-8">
      {/* Header */}
      <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-600">
            BusGo Administration
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Dashboard Overview
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Monitor bookings, revenue, tickets, and passenger boarding.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadDashboard()}
          disabled={loading}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"        >
          <RefreshCw
            size={17}
            className={loading ? "animate-spin" : ""}
          />
          Refresh Data
        </button>
      </header>

      {/* Loading and error messages */}
      {loading && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-violet-100 bg-white p-4 text-sm text-slate-600">
          <LoaderCircle
            size={20}
            className="animate-spin text-violet-600"
          />
          Loading information from your database...
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="font-semibold text-red-700">
            Unable to load dashboard
          </p>

          <p className="mt-1 text-sm text-red-600">{error}</p>

          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="mt-3 text-sm font-semibold text-red-700 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Statistics */}
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          const value = stats[card.key];

          return (
            <article
              key={card.key}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {card.title}
                  </p>

                  <p className="mt-4 text-2xl font-bold tracking-tight">
                    {loading && !data
                      ? "..."
                      : card.key === "totalRevenue"
                        ? formatETB(value)
                        : value.toLocaleString()}
                  </p>
                </div>

                <div className={`rounded-xl p-3 ${card.color}`}>
                  <Icon size={23} />
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-500">
                {card.description}
              </p>
            </article>
          );
        })}
      </section>

      {/* Quick actions */}
      <section className="mt-10">
        <div className="mb-5">
          <h2 className="text-xl font-bold">Management Center</h2>
          <p className="mt-1 text-sm text-slate-500">
            Quickly access your main management sections.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {managementLinks.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.title}
                href={item.href}
                className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-violet-300 hover:shadow-md"
              >
                <div className="rounded-xl bg-violet-50 p-3 text-violet-700 transition group-hover:bg-violet-600 group-hover:text-white">
                  <Icon size={22} />
                </div>

                <div className="min-w-0">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recent bookings */}
      <section className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold">Recent Bookings</h2>
            <p className="mt-1 text-sm text-slate-500">
              The five most recently created bookings.
            </p>
          </div>

          <Link
            href="/admin/bookings"
            className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700 hover:text-violet-900"
          >
            View all bookings
            <ArrowUpRight size={17} />
          </Link>
        </div>

        {data && data.recentBookings.length === 0 ? (
          <div className="p-10 text-center">
            <ClipboardList
              size={35}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 font-semibold">No bookings yet</p>

            <p className="mt-1 text-sm text-slate-500">
              Bookings will appear here when passengers make reservations.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Passenger</th>
                  <th className="px-5 py-4 font-semibold">Booking Ref.</th>
                  <th className="px-5 py-4 font-semibold">Route</th>
                  <th className="px-5 py-4 font-semibold">Departure</th>
                  <th className="px-5 py-4 font-semibold">Amount</th>
                  <th className="px-5 py-4 font-semibold">Booking</th>
                  <th className="px-5 py-4 font-semibold">Payment</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {(data?.recentBookings ?? []).map((booking) => (
                  <tr
                    key={booking.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800">
                        {booking.passengerName}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {booking.passengerEmail}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-semibold text-violet-700">
                        {booking.bookingReference}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium">
                        {booking.origin}
                      </p>

                      <p className="my-1 text-xs text-slate-400">
                        to
                      </p>

                      <p className="font-medium">
                        {booking.destination}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {booking.busName}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {formatDate(booking.departureTime)}
                    </td>

                    <td className="px-5 py-4 font-semibold">
                      {formatETB(booking.totalAmount)}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={booking.status} />
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex flex-col items-start gap-2">
                        <StatusBadge status={booking.paymentStatus} />

                        {booking.boarded && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                            <CheckCircle2 size={14} />
                            Boarded
                          </span>
                        )}

                        {booking.ticketNumber && (
                          <span className="text-xs text-slate-500">
                            {booking.ticketNumber}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Scanner banner */}
      <section className="mt-8 rounded-2xl bg-gradient-to-r from-violet-800 to-indigo-700 p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-violet-200">
              <QrCode size={20} />
              <span className="text-sm font-semibold">
                Boarding Management
              </span>
            </div>

            <h2 className="mt-3 text-2xl font-bold">
              Ready to verify tickets?
            </h2>

            <p className="mt-2 max-w-xl text-sm text-violet-100">
              Open the ticket scanner to validate passenger tickets and
              record boarding.
            </p>
          </div>

          <Link
            href="/scan-ticket"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-violet-800 transition hover:bg-violet-50"
          >
            <QrCode size={20} />
            Open Scanner
            <ArrowUpRight size={17} />
          </Link>
        </div>
      </section>

      <footer className="mt-8 flex flex-col justify-between gap-2 border-t border-slate-200 pt-5 text-xs text-slate-500 sm:flex-row">
        <p>BusGo Administration Dashboard</p>
        <p>Booking and ticket management</p>
      </footer>

      <span className="sr-only">
        <ArrowDownRight />
      </span>
    </main>
  );
}
