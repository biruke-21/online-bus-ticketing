
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  CalendarDays,
  Clock,
  Search,
  Plus,
  Pencil,
  Trash2,
  BusFront,
  Users,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Route as RouteIcon,
} from "lucide-react";

type Bus = {
  id: string;
  name: string;
  plateNumber: string;
  seatCount: number;
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
};

type BusRoute = {
  id: string;
  origin: string;
  destination: string;
  distanceKm: number | null;
  durationMin: number | null;
};

type Schedule = {
  id: string;
  busId: string;
  routeId: string;
  departureTime: string;
  arrivalTime: string;
  price: string | number;
  bus: Bus;
  route: BusRoute;
  _count: {
    seats: number;
    bookings: number;
  };
};

type ScheduleForm = {
  id: string;
  busId: string;
  routeId: string;
  departureTime: string;
  arrivalTime: string;
  price: string;
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  schedules?: T[];
  buses?: Bus[];
  routes?: BusRoute[];
};

const EMPTY_FORM: ScheduleForm = {
  id: "",
  busId: "",
  routeId: "",
  departureTime: "",
  arrivalTime: "",
  price: "",
};

function toDateTimeLocal(value: string) {
  const date = new Date(value);

  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  );

  return localDate.toISOString().slice(0, 16);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(departure: string, arrival: string) {
  const minutes = Math.round(
    (new Date(arrival).getTime() -
      new Date(departure).getTime()) /
      60_000,
  );

  if (minutes <= 0) return "Invalid duration";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) return `${remainingMinutes} min`;

  if (remainingMinutes === 0) return `${hours}h`;

  return `${hours}h ${remainingMinutes}m`;
}

function isUpcoming(value: string) {
  return new Date(value).getTime() >= Date.now();
}

export default function AdminSchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<BusRoute[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ScheduleForm>(EMPTY_FORM);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadSchedules = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [scheduleResponse, busResponse, routeResponse] =
        await Promise.all([
          fetch("/api/admin/schedules", { cache: "no-store" }),
          fetch("/api/admin/buses", { cache: "no-store" }),
          fetch("/api/admin/routes", { cache: "no-store" }),
        ]);

      const [scheduleText, busText, routeText] = await Promise.all([
        scheduleResponse.text(),
        busResponse.text(),
        routeResponse.text(),
      ]);

      if (
        !scheduleResponse.ok ||
        !busResponse.ok ||
        !routeResponse.ok
      ) {
        throw new Error(
          "Failed to load dashboard data. Check your API routes.",
        );
      }

      let scheduleData: ApiResponse<Schedule>;
      let busData: ApiResponse<Bus>;
      let routeData: ApiResponse<BusRoute>;

      try {
        scheduleData = JSON.parse(scheduleText);
        busData = JSON.parse(busText);
        routeData = JSON.parse(routeText);
      } catch {
        throw new Error(
          "An API returned invalid JSON. Check your terminal for errors.",
        );
      }

      if (
        !scheduleData.success ||
        !busData.success ||
        !routeData.success
      ) {
        throw new Error(
          scheduleData.message ||
            busData.message ||
            routeData.message ||
            "Unable to load dashboard data.",
        );
      }

      setSchedules(scheduleData.schedules ?? []);
      setBuses(busData.buses ?? []);
      setRoutes(routeData.routes ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load schedules.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSchedules();
  }, [loadSchedules]);

  const filteredSchedules = useMemo(() => {
    const query = search.trim().toLowerCase();

    return schedules.filter((schedule) => {
      const searchableText = [
        schedule.bus.name,
        schedule.bus.plateNumber,
        schedule.route.origin,
        schedule.route.destination,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchableText.includes(query);

      const upcoming = isUpcoming(schedule.departureTime);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "UPCOMING" && upcoming) ||
        (statusFilter === "PAST" && !upcoming);

      return matchesSearch && matchesStatus;
    });
  }, [schedules, search, statusFilter]);

  const stats = useMemo(
    () => ({
      total: schedules.length,
      upcoming: schedules.filter((schedule) =>
        isUpcoming(schedule.departureTime),
      ).length,
      seats: schedules.reduce(
        (total, schedule) => total + schedule._count.seats,
        0,
      ),
      bookings: schedules.reduce(
        (total, schedule) => total + schedule._count.bookings,
        0,
      ),
    }),
    [schedules],
  );

  function openAddModal() {
    setEditing(false);
    setError("");
    setForm({
      ...EMPTY_FORM,
      busId: buses.find((bus) => bus.status === "ACTIVE")?.id ?? "",
      routeId: routes[0]?.id ?? "",
    });
    setModalOpen(true);
  }

  function openEditModal(schedule: Schedule) {
    setEditing(true);
    setError("");

    setForm({
      id: schedule.id,
      busId: schedule.busId,
      routeId: schedule.routeId,
      departureTime: toDateTimeLocal(schedule.departureTime),
      arrivalTime: toDateTimeLocal(schedule.arrivalTime),
      price: String(schedule.price),
    });

    setModalOpen(true);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.busId || !form.routeId) {
      setError("Please select a bus and a route.");
      return;
    }

    if (!form.departureTime || !form.arrivalTime) {
      setError("Please select departure and arrival times.");
      return;
    }

    if (
      new Date(form.arrivalTime).getTime() <=
      new Date(form.departureTime).getTime()
    ) {
      setError("Arrival time must be after departure time.");
      return;
    }

    if (!form.price || !Number.isFinite(Number(form.price)) ||
        Number(form.price) <= 0) {
      setError("Enter a valid ticket price greater than zero.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...(editing ? { id: form.id } : {}),
        busId: form.busId,
        routeId: form.routeId,
        departureTime: new Date(form.departureTime).toISOString(),
        arrivalTime: new Date(form.arrivalTime).toISOString(),
        price: Number(form.price),
      };

      const response = await fetch("/api/admin/schedules", {
        method: editing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();

      let data: ApiResponse<Schedule>;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          "The server returned an invalid response. Check the terminal.",
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to save schedule.",
        );
      }

      setModalOpen(false);
      setForm(EMPTY_FORM);
      setSuccess(
        editing
          ? "Schedule updated successfully."
          : "Schedule created successfully.",
      );

      await loadSchedules();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save schedule.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(schedule: Schedule) {
    if (schedule._count.bookings > 0) {
      setError(
        "This schedule has bookings and cannot be deleted.",
      );
      return;
    }

    const confirmed = window.confirm(
      `Delete the schedule for ${schedule.route.origin} to ${schedule.route.destination} on ${formatDate(schedule.departureTime)}?`,
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/admin/schedules?id=${encodeURIComponent(schedule.id)}`,
        {
          method: "DELETE",
        },
      );

      const responseText = await response.text();

      let data: ApiResponse<Schedule>;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error("The server returned an invalid response.");
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to delete schedule.",
        );
      }

      setSuccess("Schedule deleted successfully.");
      await loadSchedules();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete schedule.",
      );
    }
  }

  return (
    <div className="min-h-screen bg-[#09090f] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-8">
        {/* Header */}
        <header className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-violet-400">
              <CalendarDays size={17} />
              BUSGO ADMINISTRATION
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Schedule Management
            </h1>

            <p className="mt-2 text-sm text-gray-400">
              Manage bus departures, routes, schedules, and ticket prices.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void loadSchedules()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium transition hover:bg-white/10 disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold shadow-lg shadow-violet-950/30 transition hover:bg-violet-500"
            >
              <Plus size={18} />
              Add Schedule
            </button>
          </div>
        </header>

        {/* Notifications */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
            <CheckCircle2 size={19} className="shrink-0" />
            <span className="flex-1">{success}</span>
            <button
              type="button"
              onClick={() => setSuccess("")}
              aria-label="Dismiss success message"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* Statistics */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Schedules"
            value={stats.total}
            description="All scheduled trips"
            icon={<CalendarDays size={21} />}
          />

          <StatCard
            title="Upcoming Trips"
            value={stats.upcoming}
            description="Departures from now"
            icon={<Clock size={21} />}
          />

          <StatCard
            title="Total Seats"
            value={stats.seats}
            description="Seats across schedules"
            icon={<BusFront size={21} />}
          />

          <StatCard
            title="Total Bookings"
            value={stats.bookings}
            description="Bookings across schedules"
            icon={<Users size={21} />}
          />
        </section>

        {/* Table */}
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#111119]">
          <div className="flex flex-col gap-4 border-b border-white/10 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                All Schedules
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                {filteredSchedules.length} schedule
                {filteredSchedules.length === 1 ? "" : "s"} found
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search buses or routes..."
                  className="w-full rounded-xl border border-white/10 bg-[#09090f] py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-gray-600 focus:border-violet-500 sm:w-72"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-xl border border-white/10 bg-[#09090f] px-4 py-3 text-sm outline-none focus:border-violet-500"
                aria-label="Filter schedules"
              >
                <option value="ALL">All schedules</option>
                <option value="UPCOMING">Upcoming</option>
                <option value="PAST">Past</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center gap-3 text-gray-400">
              <RefreshCw size={20} className="animate-spin" />
              Loading schedules...
            </div>
          ) : filteredSchedules.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <CalendarDays size={42} className="mb-4 text-gray-600" />

              <h3 className="text-lg font-semibold">
                No schedules found
              </h3>

              <p className="mt-2 max-w-md text-sm text-gray-400">
                Try another search or add a new bus schedule.
              </p>

              <button
                type="button"
                onClick={openAddModal}
                className="mt-5 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold hover:bg-violet-500"
              >
                Add your first schedule
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="bg-white/[0.025] text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-5 py-4 font-medium">Bus</th>
                    <th className="px-5 py-4 font-medium">Route</th>
                    <th className="px-5 py-4 font-medium">Departure</th>
                    <th className="px-5 py-4 font-medium">Arrival</th>
                    <th className="px-5 py-4 font-medium">Price</th>
                    <th className="px-5 py-4 font-medium">Seats</th>
                    <th className="px-5 py-4 font-medium">Bookings</th>
                    <th className="px-5 py-4 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/[0.06]">
                  {filteredSchedules.map((schedule) => (
                    <tr
                      key={schedule.id}
                      className="transition hover:bg-white/[0.025]"
                    >
                      <td className="px-5 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
                            <BusFront size={20} />
                          </div>

                          <div>
                            <p className="font-semibold text-white">
                              {schedule.bus.name}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {schedule.bus.plateNumber}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-5">
                        <div className="flex items-start gap-2">
                          <RouteIcon
                            size={17}
                            className="mt-0.5 shrink-0 text-violet-400"
                          />

                          <div>
                            <p className="font-medium text-gray-200">
                              {schedule.route.origin}
                            </p>
                            <p className="my-1 text-xs text-gray-500">
                              ↓
                            </p>
                            <p className="font-medium text-gray-200">
                              {schedule.route.destination}
                            </p>
                            {schedule.route.distanceKm != null && (
                              <p className="mt-1 text-xs text-gray-500">
                                {schedule.route.distanceKm} km
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-5">
                        <p className="font-medium text-gray-200">
                          {formatDate(schedule.departureTime)}
                        </p>
                        <p className="mt-1 text-xs text-violet-300">
                          {formatTime(schedule.departureTime)}
                        </p>
                      </td>

                      <td className="px-5 py-5">
                        <p className="font-medium text-gray-200">
                          {formatDate(schedule.arrivalTime)}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          {formatTime(schedule.arrivalTime)}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {formatDuration(
                            schedule.departureTime,
                            schedule.arrivalTime,
                          )}
                        </p>
                      </td>

                      <td className="px-5 py-5">
                        <span className="font-semibold text-emerald-300">
                          {Number(schedule.price).toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            },
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-5">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 text-gray-300">
                          <Users size={14} />
                          {schedule._count.seats}
                        </span>
                      </td>

                      <td className="px-5 py-5">
                        <span className="rounded-lg bg-violet-500/10 px-2.5 py-1.5 text-violet-300">
                          {schedule._count.bookings}
                        </span>
                      </td>

                      <td className="px-5 py-5">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(schedule)}
                            title="Edit schedule"
                            aria-label="Edit schedule"
                            className="rounded-lg border border-white/10 p-2.5 text-gray-300 transition hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-violet-300"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleDelete(schedule)}
                            disabled={schedule._count.bookings > 0}
                            title={
                              schedule._count.bookings > 0
                                ? "Cannot delete a schedule with bookings"
                                : "Delete schedule"
                            }
                            aria-label="Delete schedule"
                            className="rounded-lg border border-white/10 p-2.5 text-gray-300 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t border-white/10 px-5 py-4 text-xs text-gray-500">
            Schedule information is loaded from your PostgreSQL database.
          </div>
        </section>

        {/* Add/Edit Modal */}
        {modalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !saving) {
                setModalOpen(false);
              }
            }}
          >
            <div className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#12121b] shadow-2xl shadow-black/50">
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                <div>
                  <h2 className="text-xl font-bold">
                    {editing ? "Edit Schedule" : "Create Schedule"}
                  </h2>
                  <p className="mt-1 text-sm text-gray-400">
                    Configure the bus, route, departure, and price.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg p-2 text-gray-400 transition hover:bg-white/10 hover:text-white"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-5 p-6">
                {error && (
                  <div className="flex gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                    <AlertCircle size={18} className="shrink-0" />
                    {error}
                  </div>
                )}

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="busId"
                      className="mb-2 block text-sm font-medium text-gray-300"
                    >
                      Select Bus
                    </label>

                    <select
                      id="busId"
                      required
                      value={form.busId}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          busId: event.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-white/10 bg-[#09090f] px-4 py-3 text-sm outline-none focus:border-violet-500"
                    >
                      <option value="">Choose a bus</option>

                      {buses
                        .filter(
                          (bus) =>
                            bus.status === "ACTIVE" ||
                            bus.id === form.busId,
                        )
                        .map((bus) => (
                          <option key={bus.id} value={bus.id}>
                            {bus.name} — {bus.plateNumber} (
                            {bus.seatCount} seats)
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="routeId"
                      className="mb-2 block text-sm font-medium text-gray-300"
                    >
                      Select Route
                    </label>

                    <select
                      id="routeId"
                      required
                      value={form.routeId}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          routeId: event.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-white/10 bg-[#09090f] px-4 py-3 text-sm outline-none focus:border-violet-500"
                    >
                      <option value="">Choose a route</option>

                      {routes.map((route) => (
                        <option key={route.id} value={route.id}>
                          {route.origin} → {route.destination}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="departureTime"
                      className="mb-2 block text-sm font-medium text-gray-300"
                    >
                      Departure Date & Time
                    </label>

                    <input
                      id="departureTime"
                      type="datetime-local"
                      required
                      value={form.departureTime}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          departureTime: event.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-white/10 bg-[#09090f] px-4 py-3 text-sm text-white outline-none focus:border-violet-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="arrivalTime"
                      className="mb-2 block text-sm font-medium text-gray-300"
                    >
                      Arrival Date & Time
                    </label>

                    <input
                      id="arrivalTime"
                      type="datetime-local"
                      required
                      value={form.arrivalTime}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          arrivalTime: event.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-white/10 bg-[#09090f] px-4 py-3 text-sm text-white outline-none focus:border-violet-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="price"
                      className="mb-2 block text-sm font-medium text-gray-300"
                    >
                      Ticket Price
                    </label>

                    <div className="relative">
                      <DollarSign
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                      />

                      <input
                        id="price"
                        type="number"
                        min="0.01"
                        step="0.01"
                        required
                        value={form.price}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            price: event.target.value,
                          })
                        }
                        placeholder="Enter ticket price"
                        className="w-full rounded-xl border border-white/10 bg-[#09090f] py-3 pl-10 pr-4 text-sm outline-none focus:border-violet-500"
                      />
                    </div>

                    <p className="mt-2 text-xs text-gray-500">
                      Enter the price in the currency used by your application.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setModalOpen(false)}
                    className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-gray-300 transition hover:bg-white/5 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <RefreshCw size={17} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={17} />
                        {editing ? "Save Changes" : "Create Schedule"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111119] p-5 transition hover:border-violet-500/30">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight">
            {value.toLocaleString()}
          </p>
          <p className="mt-2 text-xs text-gray-500">{description}</p>
        </div>

        <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-3 text-violet-300">
          {icon}
        </div>
      </div>
    </div>
  );
}