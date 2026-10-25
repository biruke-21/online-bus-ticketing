
"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Bus,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Eye,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  Ticket,
  Users,
  X,
  XCircle,
} from "lucide-react";

type Booking = {
  id: string;
  bookingReference: string;
  status: string;
  passengerName: string;
  passengerEmail: string;
  passengerPhone: string;
  origin: string;
  destination: string;
  busName: string;
  departureTime: string;
  seats: string[];
  totalAmount: number;
  paymentStatus: string;
  ticketNumber: string | null;
  createdAt: string;
};

type ApiResponse = {
  success: boolean;
  bookings?: Booking[];
  message?: string;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "ETB",
    maximumFractionDigits: 2,
  }).format(amount);

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString("en-ET", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusStyle = (status: string) => {
  switch (status.toUpperCase()) {
    case "CONFIRMED":
    case "SUCCESS":
    case "COMPLETED":
    case "PAID":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";

    case "PENDING":
      return "border-amber-500/20 bg-amber-500/10 text-amber-400";

    case "CANCELLED":
    case "FAILED":
    case "REJECTED":
      return "border-red-500/20 bg-red-500/10 text-red-400";

    default:
      return "border-slate-500/20 bg-slate-500/10 text-slate-300";
  }
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusStyle(status)}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  accent,
}: {
  title: string;
  value: number | string;
  description: string;
  icon: typeof Users;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#11131d] p-5 transition hover:border-white/[0.15]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <h3 className="mt-3 text-3xl font-bold tracking-tight text-white">
            {value}
          </h3>
          <p className="mt-2 text-xs text-slate-500">{description}</p>
        </div>

        <div className={`rounded-xl border border-white/[0.06] p-3 ${accent}`}>
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [bookingFilter, setBookingFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(
    null,
  );

  const loadBookings = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await fetch("/api/admin/bookings", {
        method: "GET",
        cache: "no-store",
      });

      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load bookings.");
      }

      setBookings(Array.isArray(data.bookings) ? data.bookings : []);
    } catch (err) {
      console.error("Failed to load admin bookings:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading bookings.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  const stats = useMemo(() => {
    const confirmed = bookings.filter(
      (booking) => booking.status.toUpperCase() === "CONFIRMED",
    ).length;

    const pending = bookings.filter(
      (booking) => booking.status.toUpperCase() === "PENDING",
    ).length;

    const cancelled = bookings.filter(
      (booking) => booking.status.toUpperCase() === "CANCELLED",
    ).length;

    const revenue = bookings
      .filter((booking) =>
        ["SUCCESS", "PAID", "COMPLETED"].includes(
          booking.paymentStatus.toUpperCase(),
        ),
      )
      .reduce((sum, booking) => sum + booking.totalAmount, 0);

    return {
      total: bookings.length,
      confirmed,
      pending,
      cancelled,
      revenue,
    };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return bookings.filter((booking) => {
      const matchesSearch =
        !query ||
        booking.bookingReference.toLowerCase().includes(query) ||
        booking.passengerName.toLowerCase().includes(query) ||
        booking.passengerEmail.toLowerCase().includes(query) ||
        booking.passengerPhone.toLowerCase().includes(query) ||
        booking.origin.toLowerCase().includes(query) ||
        booking.destination.toLowerCase().includes(query) ||
        booking.busName.toLowerCase().includes(query) ||
        (booking.ticketNumber ?? "").toLowerCase().includes(query);

      const matchesBookingStatus =
        bookingFilter === "ALL" ||
        booking.status.toUpperCase() === bookingFilter;

      const matchesPaymentStatus =
        paymentFilter === "ALL" ||
        booking.paymentStatus.toUpperCase() === paymentFilter;

      return (
        matchesSearch &&
        matchesBookingStatus &&
        matchesPaymentStatus
      );
    });
  }, [bookings, search, bookingFilter, paymentFilter]);

  return (
    <div className="min-h-screen space-y-8 bg-[#0b0c14] p-4 text-white sm:p-6 lg:p-8">
      {/* Page header */}
      <header className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-violet-400">
            <Activity size={16} />
            <span>Administration / Bookings</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Booking Management
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            View and monitor passenger bookings, trips, payments, and tickets.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadBookings(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#171925] px-4 py-3 text-sm font-semibold transition hover:bg-[#202334] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />
          {refreshing ? "Refreshing..." : "Refresh bookings"}
        </button>
      </header>

      {/* Statistics */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Bookings"
          value={stats.total}
          description="All recorded bookings"
          icon={Ticket}
          accent="bg-violet-500/10 text-violet-400"
        />

        <StatCard
          title="Confirmed"
          value={stats.confirmed}
          description="Confirmed reservations"
          icon={CheckCircle2}
          accent="bg-emerald-500/10 text-emerald-400"
        />

        <StatCard
          title="Pending"
          value={stats.pending}
          description="Awaiting confirmation"
          icon={Clock3}
          accent="bg-amber-500/10 text-amber-400"
        />

        <StatCard
          title="Cancelled"
          value={stats.cancelled}
          description="Cancelled reservations"
          icon={XCircle}
          accent="bg-red-500/10 text-red-400"
        />
      </section>

      {/* Revenue summary */}
      <section className="flex flex-col justify-between gap-4 rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-500/10 via-[#151525] to-[#11131d] p-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-slate-400">Successful Payment Revenue</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
            {formatCurrency(stats.revenue)}
          </h2>
          <p className="mt-2 text-xs text-slate-500">
            Calculated from bookings with SUCCESS, PAID, or COMPLETED payment status.
          </p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
          <CreditCard size={24} />
        </div>
      </section>

      {/* Search and filters */}
      <section className="rounded-2xl border border-white/[0.08] bg-[#11131d] p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search reference, passenger, email, route, bus..."
              className="w-full rounded-xl border border-white/10 bg-[#0b0c14] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/10"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:w-[420px]">
            <select
              value={bookingFilter}
              onChange={(event) => setBookingFilter(event.target.value)}
              aria-label="Filter by booking status"
              className="rounded-xl border border-white/10 bg-[#0b0c14] px-3 py-3 text-sm text-slate-200 outline-none focus:border-violet-500/60"
            >
              <option value="ALL">All booking statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <select
              value={paymentFilter}
              onChange={(event) => setPaymentFilter(event.target.value)}
              aria-label="Filter by payment status"
              className="rounded-xl border border-white/10 bg-[#0b0c14] px-3 py-3 text-sm text-slate-200 outline-none focus:border-violet-500/60"
            >
              <option value="ALL">All payment statuses</option>
              <option value="PENDING">Pending</option>
              <option value="SUCCESS">Success</option>
              <option value="PAID">Paid</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            Showing{" "}
            <span className="font-semibold text-slate-300">
              {filteredBookings.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-300">
              {bookings.length}
            </span>{" "}
            bookings
          </span>

          {(search || bookingFilter !== "ALL" || paymentFilter !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setBookingFilter("ALL");
                setPaymentFilter("ALL");
              }}
              className="text-violet-400 transition hover:text-violet-300"
            >
              Clear filters
            </button>
          )}
        </div>
      </section>

      {/* Bookings table */}
      <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#11131d]">
        <div className="flex flex-col gap-2 border-b border-white/[0.07] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-white">All Bookings</h2>
            <p className="mt-1 text-xs text-slate-500">
              Booking and passenger information from your database.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Live database data
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3">
            <Loader2 size={30} className="animate-spin text-violet-400" />
            <p className="text-sm text-slate-400">Loading bookings...</p>
          </div>
        ) : error ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <AlertCircle size={34} className="text-red-400" />
            <h3 className="mt-4 font-semibold text-white">
              Could not load bookings
            </h3>
            <p className="mt-2 max-w-md text-sm text-slate-400">{error}</p>

            <button
              type="button"
              onClick={() => void loadBookings()}
              className="mt-5 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold transition hover:bg-violet-500"
            >
              Try again
            </button>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <Ticket size={36} className="text-slate-600" />

            <h3 className="mt-4 font-semibold text-white">
              No bookings found
            </h3>

            <p className="mt-2 max-w-sm text-sm text-slate-500">
              {bookings.length === 0
                ? "No bookings have been recorded yet."
                : "Try changing your search or filters."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left">
              <thead className="border-b border-white/[0.07] bg-white/[0.02]">
                <tr className="text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-4 font-medium">Booking</th>
                  <th className="px-5 py-4 font-medium">Passenger</th>
                  <th className="px-5 py-4 font-medium">Trip</th>
                  <th className="px-5 py-4 font-medium">Seats</th>
                  <th className="px-5 py-4 font-medium">Amount</th>
                  <th className="px-5 py-4 font-medium">Booking Status</th>
                  <th className="px-5 py-4 font-medium">Payment</th>
                  <th className="px-5 py-4 font-medium">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/[0.05]">
                {filteredBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="transition hover:bg-white/[0.025]"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-violet-300">
                        {booking.bookingReference}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDate(booking.createdAt)}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="max-w-[180px] truncate text-sm font-medium text-slate-200">
                        {booking.passengerName}
                      </p>
                      <p className="mt-1 max-w-[180px] truncate text-xs text-slate-500">
                        {booking.passengerEmail}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="whitespace-nowrap text-sm font-medium text-slate-200">
                        {booking.origin}
                      </p>
                      <p className="my-1 text-xs text-slate-500">to</p>
                      <p className="whitespace-nowrap text-sm font-medium text-slate-200">
                        {booking.destination}
                      </p>
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                        <Bus size={13} />
                        {booking.busName}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex max-w-[150px] flex-wrap gap-1">
                        {booking.seats.length > 0 ? (
                          booking.seats.map((seat) => (
                            <span
                              key={seat}
                              className="rounded-md border border-violet-500/20 bg-violet-500/10 px-2 py-1 text-xs text-violet-300"
                            >
                              {seat}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500">
                            No seats
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <p className="whitespace-nowrap font-semibold text-white">
                        {formatCurrency(booking.totalAmount)}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={booking.status} />
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={booking.paymentStatus} />
                    </td>

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => setSelectedBooking(booking)}
                        aria-label={`View booking ${booking.bookingReference}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-violet-300"
                      >
                        <Eye size={14} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Booking details modal */}
      {selectedBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedBooking(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-details-title"
            className="my-6 w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#11131d] shadow-2xl shadow-black/40"
          >
            <div className="flex items-start justify-between border-b border-white/[0.08] p-5 sm:p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-400">
                  Booking Details
                </p>
                <h2
                  id="booking-details-title"
                  className="mt-2 text-xl font-bold text-white"
                >
                  {selectedBooking.bookingReference}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Created {formatDate(selectedBooking.createdAt)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                aria-label="Close booking details"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 p-5 sm:p-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                  <p className="text-xs text-slate-500">Booking Status</p>
                  <div className="mt-2">
                    <StatusBadge status={selectedBooking.status} />
                  </div>
                </div>

                <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                  <p className="text-xs text-slate-500">Payment Status</p>
                  <div className="mt-2">
                    <StatusBadge status={selectedBooking.paymentStatus} />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                  <Users size={16} className="text-violet-400" />
                  Passenger Information
                </h3>

                <div className="space-y-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                  <p className="flex items-center gap-3 text-sm text-slate-300">
                    <Users size={16} className="shrink-0 text-slate-500" />
                    {selectedBooking.passengerName}
                  </p>

                  <p className="flex items-center gap-3 break-all text-sm text-slate-300">
                    <Mail size={16} className="shrink-0 text-slate-500" />
                    {selectedBooking.passengerEmail}
                  </p>

                  <p className="flex items-center gap-3 text-sm text-slate-300">
                    <Phone size={16} className="shrink-0 text-slate-500" />
                    {selectedBooking.passengerPhone}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                  <Bus size={16} className="text-violet-400" />
                  Trip Information
                </h3>

                <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                  <div className="flex items-start gap-3">
                    <MapPin
                      size={18}
                      className="mt-0.5 shrink-0 text-violet-400"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white">
                        {selectedBooking.origin}
                      </p>

                      <div className="my-2 ml-1 h-5 border-l border-dashed border-slate-600" />

                      <p className="font-semibold text-white">
                        {selectedBooking.destination}
                      </p>

                      <p className="mt-3 text-sm text-slate-400">
                        Bus: {selectedBooking.busName}
                      </p>

                      <p className="mt-1 flex items-center gap-2 text-sm text-slate-400">
                        <CalendarDays size={15} />
                        Departure: {formatDate(selectedBooking.departureTime)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                  <p className="text-xs text-slate-500">Reserved Seats</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedBooking.seats.length > 0 ? (
                      selectedBooking.seats.map((seat) => (
                        <span
                          key={seat}
                          className="rounded-lg border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-sm font-semibold text-violet-300"
                        >
                          {seat}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500">
                        No seats recorded
                      </span>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                  <p className="text-xs text-slate-500">Total Amount</p>
                  <p className="mt-2 text-2xl font-bold text-white">
                    {formatCurrency(selectedBooking.totalAmount)}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                <div className="flex items-start gap-3">
                  <Ticket size={18} className="mt-0.5 text-violet-400" />

                  <div>
                    <p className="text-xs text-slate-500">Ticket Number</p>
                    <p className="mt-1 font-semibold text-white">
                      {selectedBooking.ticketNumber ?? "Not generated yet"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
                >
                  <ArrowDownRight size={16} />
                  Print details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="flex flex-col gap-2 border-t border-white/[0.07] pt-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>BusGo Admin · Booking Management</p>
        <p>Showing database booking records</p>
      </footer>
    </div>
  );
}

