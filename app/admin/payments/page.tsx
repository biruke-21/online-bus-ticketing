
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowDownToLine,
  Bus,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Eye,
  Loader2,
  Mail,
  MapPin,
  RefreshCw,
  Search,
  TrendingUp,
  Users,
  X,
  XCircle,
} from "lucide-react";

type Payment = {
  id: string;
  bookingId: string;
  bookingReference: string;
  passengerName: string;
  passengerEmail: string;
  origin: string;
  destination: string;
  busName: string;
  amount: number;
  paymentStatus: string;
  paymentMethod: string;
  transactionId: string;
  bookingStatus: string;
  createdAt: string;
};

type PaymentsResponse = {
  success: boolean;
  payments?: Payment[];
  message?: string;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value: string) {
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
}

function getStatusStyle(status: string) {
  switch (status.toUpperCase()) {
    case "PAID":
    case "SUCCESS":
    case "COMPLETED":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";

    case "PENDING":
      return "border-amber-500/20 bg-amber-500/10 text-amber-400";

    case "FAILED":
    case "CANCELLED":
      return "border-red-500/20 bg-red-500/10 text-red-400";

    case "REFUNDED":
      return "border-sky-500/20 bg-sky-500/10 text-sky-400";

    default:
      return "border-slate-500/20 bg-slate-500/10 text-slate-300";
  }
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusStyle(status)}`}
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
  iconStyle,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: typeof CreditCard;
  iconStyle: string;
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

        <div className={`rounded-xl border border-white/[0.06] p-3 ${iconStyle}`}>
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(
    null,
  );

  const loadPayments = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await fetch("/api/admin/payments", {
        method: "GET",
        cache: "no-store",
      });

      const data = (await response.json()) as PaymentsResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load payment records.");
      }

      setPayments(Array.isArray(data.payments) ? data.payments : []);
    } catch (err) {
      console.error("Admin payments loading error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading payments.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  const stats = useMemo(() => {
    const successful = payments.filter((payment) =>
      ["PAID", "SUCCESS", "COMPLETED"].includes(
        payment.paymentStatus.toUpperCase(),
      ),
    );

    const pending = payments.filter(
      (payment) => payment.paymentStatus.toUpperCase() === "PENDING",
    );

    const failed = payments.filter((payment) =>
      ["FAILED", "CANCELLED"].includes(
        payment.paymentStatus.toUpperCase(),
      ),
    );

    const revenue = successful.reduce(
      (sum, payment) => sum + payment.amount,
      0,
    );

    return {
      total: payments.length,
      successful: successful.length,
      pending: pending.length,
      failed: failed.length,
      revenue,
    };
  }, [payments]);

  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return payments.filter((payment) => {
      const matchesSearch =
        !query ||
        payment.bookingReference.toLowerCase().includes(query) ||
        payment.passengerName.toLowerCase().includes(query) ||
        payment.passengerEmail.toLowerCase().includes(query) ||
        payment.transactionId.toLowerCase().includes(query) ||
        payment.paymentMethod.toLowerCase().includes(query) ||
        payment.origin.toLowerCase().includes(query) ||
        payment.destination.toLowerCase().includes(query) ||
        payment.busName.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        payment.paymentStatus.toUpperCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [payments, search, statusFilter]);

  function exportPayments() {
    const headers = [
      "Booking Reference",
      "Passenger",
      "Email",
      "Origin",
      "Destination",
      "Bus",
      "Amount",
      "Payment Status",
      "Payment Method",
      "Transaction ID",
      "Booking Status",
      "Created At",
    ];

    const rows = filteredPayments.map((payment) => [
      payment.bookingReference,
      payment.passengerName,
      payment.passengerEmail,
      payment.origin,
      payment.destination,
      payment.busName,
      payment.amount,
      payment.paymentStatus,
      payment.paymentMethod,
      payment.transactionId,
      payment.bookingStatus,
      payment.createdAt,
    ]);

    const escapeCsv = (value: string | number) =>
      `"${String(value).replaceAll('"', '""')}"`;

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "busgo-payments.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen space-y-8 bg-[#0b0c14] p-4 text-white sm:p-6 lg:p-8">
      {/* Header */}
      <header className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-violet-400">
            <Activity size={16} />
            <span>Administration / Payments</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Payment Management
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Monitor transactions, payment statuses, and booking revenue.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={exportPayments}
            disabled={filteredPayments.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#171925] px-4 py-3 text-sm font-semibold transition hover:bg-[#202334] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowDownToLine size={16} />
            Export CSV
          </button>

          <button
            type="button"
            onClick={() => void loadPayments(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </header>

      {/* Statistics */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Payments"
          value={stats.total}
          description="All payment records"
          icon={CreditCard}
          iconStyle="bg-violet-500/10 text-violet-400"
        />

        <StatCard
          title="Successful Payments"
          value={stats.successful}
          description="Paid or completed transactions"
          icon={CheckCircle2}
          iconStyle="bg-emerald-500/10 text-emerald-400"
        />

        <StatCard
          title="Pending Payments"
          value={stats.pending}
          description="Awaiting payment"
          icon={Clock3}
          iconStyle="bg-amber-500/10 text-amber-400"
        />

        <StatCard
          title="Failed Payments"
          value={stats.failed}
          description="Failed or cancelled payments"
          icon={XCircle}
          iconStyle="bg-red-500/10 text-red-400"
        />
      </section>

      {/* Revenue card */}
      <section className="flex flex-col justify-between gap-4 rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-500/10 via-[#151525] to-[#11131d] p-5 sm:flex-row sm:items-center">
        <div>
          <p className="flex items-center gap-2 text-sm text-slate-400">
            <TrendingUp size={16} className="text-emerald-400" />
            Successful Payment Revenue
          </p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
            {formatCurrency(stats.revenue)}
          </h2>

          <p className="mt-2 text-xs text-slate-500">
            Sum of payment amounts associated with successful payments.
          </p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
          <CreditCard size={24} />
        </div>
      </section>

      {/* Search and filters */}
      <section className="rounded-2xl border border-white/[0.08] bg-[#11131d] p-4 sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search booking, passenger, transaction, or route..."
              className="w-full rounded-xl border border-white/10 bg-[#0b0c14] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/10"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter payments by status"
            className="rounded-xl border border-white/10 bg-[#0b0c14] px-4 py-3 text-sm text-slate-200 outline-none focus:border-violet-500/60 md:w-56"
          >
            <option value="ALL">All payment statuses</option>
            <option value="PAID">Paid</option>
            <option value="SUCCESS">Success</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            Showing{" "}
            <span className="font-semibold text-slate-300">
              {filteredPayments.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-300">
              {payments.length}
            </span>{" "}
            payments
          </span>

          {(search || statusFilter !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
              }}
              className="text-violet-400 transition hover:text-violet-300"
            >
              Clear filters
            </button>
          )}
        </div>
      </section>

      {/* Payment table */}
      <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#11131d]">
        <div className="border-b border-white/[0.07] px-5 py-4">
          <h2 className="font-semibold text-white">Payment Transactions</h2>
          <p className="mt-1 text-xs text-slate-500">
            Payment information retrieved from your database.
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3">
            <Loader2 size={30} className="animate-spin text-violet-400" />
            <p className="text-sm text-slate-400">Loading payments...</p>
          </div>
        ) : error ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <AlertCircle size={34} className="text-red-400" />
            <h3 className="mt-4 font-semibold text-white">
              Could not load payments
            </h3>
            <p className="mt-2 max-w-md text-sm text-slate-400">{error}</p>

            <button
              type="button"
              onClick={() => void loadPayments()}
              className="mt-5 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold transition hover:bg-violet-500"
            >
              Try again
            </button>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <CreditCard size={36} className="text-slate-600" />

            <h3 className="mt-4 font-semibold text-white">
              No payments found
            </h3>

            <p className="mt-2 max-w-sm text-sm text-slate-500">
              {payments.length === 0
                ? "There are no payment records in the database yet."
                : "Try changing your search or status filter."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left">
              <thead className="border-b border-white/[0.07] bg-white/[0.02]">
                <tr className="text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-4 font-medium">Booking</th>
                  <th className="px-5 py-4 font-medium">Passenger</th>
                  <th className="px-5 py-4 font-medium">Trip</th>
                  <th className="px-5 py-4 font-medium">Amount</th>
                  <th className="px-5 py-4 font-medium">Payment Method</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 font-medium">Transaction</th>
                  <th className="px-5 py-4 font-medium">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/[0.05]">
                {filteredPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="transition hover:bg-white/[0.025]"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-violet-300">
                        {payment.bookingReference}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDate(payment.createdAt)}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="max-w-[180px] truncate text-sm font-medium text-slate-200">
                        {payment.passengerName}
                      </p>
                      <p className="mt-1 max-w-[180px] truncate text-xs text-slate-500">
                        {payment.passengerEmail}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="whitespace-nowrap text-sm text-slate-200">
                        {payment.origin} → {payment.destination}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                        <Bus size={13} />
                        {payment.busName}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="whitespace-nowrap font-semibold text-white">
                        {formatCurrency(payment.amount)}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span className="whitespace-nowrap text-sm text-slate-300">
                        {payment.paymentMethod.replaceAll("_", " ")}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={payment.paymentStatus} />
                    </td>

                    <td className="px-5 py-4">
                      <p
                        className="max-w-[150px] truncate font-mono text-xs text-slate-400"
                        title={payment.transactionId}
                      >
                        {payment.transactionId}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => setSelectedPayment(payment)}
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

      {/* Payment details modal */}
      {selectedPayment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedPayment(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-details-title"
            className="my-6 w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#11131d] shadow-2xl shadow-black/40"
          >
            <div className="flex items-start justify-between border-b border-white/[0.08] p-5 sm:p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-400">
                  Transaction Details
                </p>

                <h2
                  id="payment-details-title"
                  className="mt-2 text-xl font-bold text-white"
                >
                  {selectedPayment.bookingReference}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {formatDate(selectedPayment.createdAt)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPayment(null)}
                aria-label="Close payment details"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 p-5 sm:p-6">
              <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.06] p-5">
                <p className="text-sm text-slate-400">Payment Amount</p>
                <p className="mt-2 text-3xl font-bold text-white">
                  {formatCurrency(selectedPayment.amount)}
                </p>
                <div className="mt-3">
                  <StatusBadge status={selectedPayment.paymentStatus} />
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
                    {selectedPayment.passengerName}
                  </p>

                  <p className="flex items-center gap-3 break-all text-sm text-slate-300">
                    <Mail size={16} className="shrink-0 text-slate-500" />
                    {selectedPayment.passengerEmail}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                  <Bus size={16} className="text-violet-400" />
                  Trip Information
                </h3>

                <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                  <p className="flex items-center gap-2 text-sm text-slate-300">
                    <MapPin size={16} className="text-violet-400" />
                    {selectedPayment.origin} → {selectedPayment.destination}
                  </p>

                  <p className="mt-3 flex items-center gap-2 text-sm text-slate-400">
                    <Bus size={16} />
                    {selectedPayment.busName}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                  <CreditCard size={16} className="text-violet-400" />
                  Transaction Information
                </h3>

                <div className="space-y-4 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                  <div>
                    <p className="text-xs text-slate-500">Transaction ID</p>
                    <p className="mt-1 break-all font-mono text-sm text-slate-200">
                      {selectedPayment.transactionId}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Payment Method</p>
                    <p className="mt-1 text-sm text-slate-200">
                      {selectedPayment.paymentMethod.replaceAll("_", " ")}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Booking Status</p>
                    <div className="mt-2">
                      <StatusBadge status={selectedPayment.bookingStatus} />
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Booking ID</p>
                    <p className="mt-1 break-all font-mono text-xs text-slate-400">
                      {selectedPayment.bookingId}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedPayment(null)}
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
                >
                  <ArrowDownToLine size={16} />
                  Print details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="flex flex-col gap-2 border-t border-white/[0.07] pt-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>BusGo Admin · Payment Management</p>
        <p>Payment records are loaded from your database.</p>
      </footer>
    </div>
  );
}
