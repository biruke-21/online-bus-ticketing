
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  Route as RouteIcon,
  Search,
  Plus,
  Pencil,
  Trash2,
  MapPin,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Navigation,
  Ruler,
  Clock,
  BusFront,
} from "lucide-react";

type BusRoute = {
  id: string;
  origin: string;
  destination: string;
  distanceKm: number | null;
  durationMin: number | null;
  _count?: {
    schedules: number;
  };
};

type RoutesResponse = {
  success: boolean;
  message?: string;
  routes?: BusRoute[];
};

type RouteForm = {
  id: string;
  origin: string;
  destination: string;
  distanceKm: string;
  durationMin: string;
};

const EMPTY_FORM: RouteForm = {
  id: "",
  origin: "",
  destination: "",
  distanceKm: "",
  durationMin: "",
};

export default function AdminRoutesPage() {
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState(false);
  const [form, setForm] = useState<RouteForm>(EMPTY_FORM);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadRoutes = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/routes", {
        cache: "no-store",
      });

      const result = (await response.json()) as RoutesResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || `Failed to load routes (${response.status}).`,
        );
      }

      setRoutes(result.routes ?? []);
    } catch (err) {
      console.error("Load routes error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load routes. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRoutes();
  }, [loadRoutes]);

  const filteredRoutes = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return routes;

    return routes.filter((route) => {
      return (
        route.origin.toLowerCase().includes(query) ||
        route.destination.toLowerCase().includes(query)
      );
    });
  }, [routes, search]);

  const totalDistance = useMemo(
    () =>
      routes.reduce(
        (total, route) => total + (route.distanceKm ?? 0),
        0,
      ),
    [routes],
  );

  const totalSchedules = useMemo(
    () =>
      routes.reduce(
        (total, route) => total + (route._count?.schedules ?? 0),
        0,
      ),
    [routes],
  );

  function openAddModal() {
    setForm(EMPTY_FORM);
    setEditingRoute(false);
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function openEditModal(route: BusRoute) {
    setForm({
      id: route.id,
      origin: route.origin,
      destination: route.destination,
      distanceKm: route.distanceKm?.toString() ?? "",
      durationMin: route.durationMin?.toString() ?? "",
    });

    setEditingRoute(true);
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const origin = form.origin.trim();
    const destination = form.destination.trim();

    if (!origin || !destination) {
      setError("Please enter both the origin and destination.");
      return;
    }

    if (origin.toLowerCase() === destination.toLowerCase()) {
      setError("Origin and destination must be different.");
      return;
    }

    const distanceText = form.distanceKm.trim();
    const durationText = form.durationMin.trim();

    const distanceKm =
      distanceText === "" ? null : Number(distanceText);

    const durationMin =
      durationText === "" ? null : Number(durationText);

    if (
      distanceKm !== null &&
      (!Number.isFinite(distanceKm) || distanceKm <= 0)
    ) {
      setError("Distance must be greater than zero.");
      return;
    }

    if (
      durationMin !== null &&
      (!Number.isInteger(durationMin) || durationMin <= 0)
    ) {
      setError("Duration must be a positive whole number of minutes.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/admin/routes", {
        method: editingRoute ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(editingRoute ? { id: form.id } : {}),
          origin,
          destination,
          distanceKm,
          durationMin,
        }),
      });

      const result = (await response.json()) as {
        success: boolean;
        message?: string;
        route?: BusRoute;
      };

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            `Unable to ${editingRoute ? "update" : "create"} route.`,
        );
      }

      setSuccess(
        result.message ||
          (editingRoute
            ? "Route updated successfully."
            : "Route created successfully."),
      );

      setModalOpen(false);
      setForm(EMPTY_FORM);

      await loadRoutes();
    } catch (err) {
      console.error("Save route error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(route: BusRoute) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${route.origin} → ${route.destination}?\n\nRoutes with existing schedules cannot be deleted.`,
    );

    if (!confirmed) return;

    setDeletingId(route.id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/admin/routes?id=${encodeURIComponent(route.id)}`,
        {
          method: "DELETE",
        },
      );

      const result = (await response.json()) as RoutesResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to delete this route.",
        );
      }

      setSuccess("Route deleted successfully.");
      await loadRoutes();
    } catch (err) {
      console.error("Delete route error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete this route.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  function formatDuration(minutes: number | null) {
    if (minutes === null) return "Not specified";

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours === 0) return `${remainingMinutes} min`;
    if (remainingMinutes === 0) return `${hours} hr`;

    return `${hours} hr ${remainingMinutes} min`;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-8">
        {/* Header */}
        <header className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-violet-400">
              <RouteIcon size={17} />
              <span>BUSGO ADMINISTRATION</span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Route Management
            </h1>

            <p className="mt-2 text-sm text-slate-400 sm:text-base">
              Create, organize, and manage your bus routes.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void loadRoutes()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800 disabled:opacity-50"
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
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-500"
            >
              <Plus size={18} />
              Add Route
            </button>
          </div>
        </header>

        {/* Notifications */}
        {success && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300"
          >
            <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
            <p>{success}</p>
            <button
              type="button"
              onClick={() => setSuccess("")}
              className="ml-auto text-emerald-300 hover:text-white"
              aria-label="Dismiss success message"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {error && !modalOpen && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
          >
            <AlertCircle size={20} className="mt-0.5 shrink-0" />
            <p>{error}</p>
            <button
              type="button"
              onClick={() => setError("")}
              className="ml-auto text-red-300 hover:text-white"
              aria-label="Dismiss error message"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Statistics */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            title="Total Routes"
            value={routes.length.toString()}
            description="Routes registered in the database"
            icon={<RouteIcon size={21} />}
          />

          <StatCard
            title="Combined Distance"
            value={`${totalDistance.toLocaleString()} km`}
            description="Sum of the distances of all routes"
            icon={<Ruler size={21} />}
          />

          <StatCard
            title="Linked Schedules"
            value={totalSchedules.toString()}
            description="Schedules associated with these routes"
            icon={<BusFront size={21} />}
          />
        </section>

        {/* Route table */}
        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl shadow-black/10">
          <div className="flex flex-col gap-4 border-b border-slate-800 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">All Routes</h2>
              <p className="mt-1 text-sm text-slate-400">
                {filteredRoutes.length} route
                {filteredRoutes.length === 1 ? "" : "s"} found
              </p>
            </div>

            <div className="relative w-full sm:max-w-sm">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search origin or destination..."
                aria-label="Search routes"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw
                size={28}
                className="animate-spin text-violet-400"
              />
              <p className="text-sm">Loading routes...</p>
            </div>
          ) : filteredRoutes.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800">
                <RouteIcon size={28} className="text-slate-400" />
              </div>

              <h3 className="text-lg font-semibold">
                {search ? "No matching routes" : "No routes yet"}
              </h3>

              <p className="mt-2 max-w-sm text-sm text-slate-400">
                {search
                  ? "Try another origin or destination."
                  : "Create your first route to start organizing bus schedules."}
              </p>

              {!search && (
                <button
                  type="button"
                  onClick={openAddModal}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold hover:bg-violet-500"
                >
                  <Plus size={17} />
                  Create your first route
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-4 font-semibold">Route</th>
                    <th className="px-5 py-4 font-semibold">Distance</th>
                    <th className="px-5 py-4 font-semibold">Duration</th>
                    <th className="px-5 py-4 font-semibold">Schedules</th>
                    <th className="px-5 py-4 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800">
                  {filteredRoutes.map((route) => (
                    <tr
                      key={route.id}
                      className="transition hover:bg-slate-800/40"
                    >
                      <td className="px-5 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10 text-violet-300">
                            <Navigation size={20} />
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2 font-semibold text-white">
                              <span>{route.origin}</span>
                              <ArrowRight
                                size={15}
                                className="text-violet-400"
                              />
                              <span>{route.destination}</span>
                            </div>

                            <p className="mt-1 text-xs text-slate-500">
                              ID: {route.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-5">
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                          <Ruler size={16} className="text-slate-500" />
                          {route.distanceKm !== null
                            ? `${route.distanceKm.toLocaleString()} km`
                            : "Not specified"}
                        </div>
                      </td>

                      <td className="px-5 py-5">
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                          <Clock size={16} className="text-slate-500" />
                          {formatDuration(route.durationMin)}
                        </div>
                      </td>

                      <td className="px-5 py-5">
                        <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-300">
                          <BusFront size={14} />
                          {route._count?.schedules ?? 0}
                        </span>
                      </td>

                      <td className="px-5 py-5">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(route)}
                            title="Edit route"
                            aria-label={`Edit ${route.origin} to ${route.destination}`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 transition hover:border-violet-500/50 hover:bg-violet-500/10 hover:text-violet-300"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleDelete(route)}
                            disabled={deletingId === route.id}
                            title="Delete route"
                            aria-label={`Delete ${route.origin} to ${route.destination}`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 transition hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingId === route.id ? (
                              <RefreshCw
                                size={16}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t border-slate-800 px-5 py-4 text-xs text-slate-500">
            Showing {filteredRoutes.length} of {routes.length} routes
          </div>
        </section>

        {/* Add/Edit Modal */}
        {modalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeModal();
              }
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="route-modal-title"
              className="my-auto w-full max-w-xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/40"
            >
              <div className="flex items-center justify-between border-b border-slate-800 p-5 sm:p-6">
                <div>
                  <h2
                    id="route-modal-title"
                    className="text-xl font-bold text-white"
                  >
                    {editingRoute ? "Edit Route" : "Add New Route"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Enter the route details below.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  aria-label="Close dialog"
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
                  >
                    <AlertCircle
                      size={18}
                      className="mt-0.5 shrink-0"
                    />
                    <p>{error}</p>
                  </div>
                )}

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="origin"
                      className="mb-2 block text-sm font-medium text-slate-300"
                    >
                      Origin <span className="text-red-400">*</span>
                    </label>

                    <div className="relative">
                      <MapPin
                        size={17}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                      />

                      <input
                        id="origin"
                        type="text"
                        required
                        maxLength={100}
                        value={form.origin}
                        onChange={(event) =>
                          setForm((previous) => ({
                            ...previous,
                            origin: event.target.value,
                          }))
                        }
                        placeholder="e.g. Addis Ababa"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="destination"
                      className="mb-2 block text-sm font-medium text-slate-300"
                    >
                      Destination <span className="text-red-400">*</span>
                    </label>

                    <div className="relative">
                      <Navigation
                        size={17}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                      />

                      <input
                        id="destination"
                        type="text"
                        required
                        maxLength={100}
                        value={form.destination}
                        onChange={(event) =>
                          setForm((previous) => ({
                            ...previous,
                            destination: event.target.value,
                          }))
                        }
                        placeholder="e.g. Bahir Dar"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="distanceKm"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Distance (km)
                  </label>

                  <div className="relative">
                    <Ruler
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                    />

                    <input
                      id="distanceKm"
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={form.distanceKm}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          distanceKm: event.target.value,
                        }))
                      }
                      placeholder="e.g. 565"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                    />
                  </div>

                  <p className="mt-1.5 text-xs text-slate-500">
                    Optional. Enter the approximate route distance.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="durationMin"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Estimated Duration (minutes)
                  </label>

                  <div className="relative">
                    <Clock
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                    />

                    <input
                      id="durationMin"
                      type="number"
                      min="1"
                      step="1"
                      value={form.durationMin}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          durationMin: event.target.value,
                        }))
                      }
                      placeholder="e.g. 540"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                    />
                  </div>

                  <p className="mt-1.5 text-xs text-slate-500">
                    Optional. Enter the estimated journey time in minutes.
                  </p>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <RefreshCw size={17} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        {editingRoute ? (
                          <Pencil size={17} />
                        ) : (
                          <Plus size={17} />
                        )}
                        {editingRoute ? "Save Changes" : "Create Route"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

type StatCardProps = {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
};

function StatCard({
  title,
  value,
  description,
  icon,
}: StatCardProps) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-violet-500/30">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-white">
            {value}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10 text-violet-300">
          {icon}
        </div>
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </article>
  );
}
