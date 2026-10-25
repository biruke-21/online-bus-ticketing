"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
BusFront,
Search,
Plus,
RefreshCw,
X,
Pencil,
Users,
CalendarDays,
CheckCircle2,
Wrench,
Ban,
AlertCircle,
} from "lucide-react";

type BusStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE";

type Bus = {
id: string;
name: string;
plateNumber: string;
seatCount: number;
status: BusStatus;
scheduleCount: number;
createdAt: string;
};

type BusForm = {
name: string;
plateNumber: string;
seatCount: string;
status: BusStatus;
};

const emptyForm: BusForm = {
name: "",
plateNumber: "",
seatCount: "49",
status: "ACTIVE",
};

const statusStyles: Record<BusStatus, string> = {
ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
INACTIVE: "bg-slate-100 text-slate-600 ring-slate-500/20",
MAINTENANCE: "bg-amber-50 text-amber-700 ring-amber-600/20",
};

function StatusBadge({ status }: { status: BusStatus }) {
return (
<span
className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${statusStyles[status]}`}
>
<span
className={`h-1.5 w-1.5 rounded-full ${
          status === "ACTIVE"
            ? "bg-emerald-500"
            : status === "MAINTENANCE"
              ? "bg-amber-500"
              : "bg-slate-400"
        }`}
/>
{status.charAt(0) + status.slice(1).toLowerCase()} </span>
);
}

export default function AdminBusesPage() {
const [buses, setBuses] = useState<Bus[]>([]);
const [search, setSearch] = useState("");
const [statusFilter, setStatusFilter] = useState("ALL");
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [error, setError] = useState("");
const [success, setSuccess] = useState("");
const [modalOpen, setModalOpen] = useState(false);
const [editingBus, setEditingBus] = useState<Bus | null>(null);
const [form, setForm] = useState<BusForm>(emptyForm);

const loadBuses = useCallback(async () => {
setLoading(true);
setError("");


try {
  const response = await fetch("/api/admin/buses");
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Unable to load buses.");
  }

  setBuses(data.buses);
} catch (err) {
  setError(
    err instanceof Error ? err.message : "Failed to load buses.",
  );
} finally {
  setLoading(false);
}


}, []);

useEffect(() => {
void loadBuses();
}, [loadBuses]);

const filteredBuses = useMemo(() => {
const query = search.trim().toLowerCase();

return buses.filter((bus) => {
  const matchesSearch =
    !query ||
    bus.name.toLowerCase().includes(query) ||
    bus.plateNumber.toLowerCase().includes(query);

  const matchesStatus =
    statusFilter === "ALL" || bus.status === statusFilter;

  return matchesSearch && matchesStatus;
});

}, [buses, search, statusFilter]);

const activeCount = buses.filter(
(bus) => bus.status === "ACTIVE",
).length;

const maintenanceCount = buses.filter(
(bus) => bus.status === "MAINTENANCE",
).length;

const totalSeats = buses.reduce(
(total, bus) => total + bus.seatCount,
0,
);

function openAddModal() {
setEditingBus(null);
setForm(emptyForm);
setError("");
setSuccess("");
setModalOpen(true);
}

function openEditModal(bus: Bus) {
setEditingBus(bus);
setForm({
name: bus.name,
plateNumber: bus.plateNumber,
seatCount: String(bus.seatCount),
status: bus.status,
});
setError("");
setSuccess("");
setModalOpen(true);
}

function closeModal() {
if (saving) return;

setModalOpen(false);
setEditingBus(null);
setForm(emptyForm);
setError("");


}

async function handleSaveBus(
event: React.FormEvent<HTMLFormElement>,
) {
event.preventDefault();


const name = form.name.trim();
const plateNumber = form.plateNumber.trim();
const seatCount = Number(form.seatCount);

if (!name || !plateNumber) {
  setError("Please enter the bus name and plate number.");
  return;
}

if (
  !Number.isInteger(seatCount) ||
  seatCount < 1 ||
  seatCount > 200
) {
  setError("Seat capacity must be a whole number between 1 and 200.");
  return;
}

setSaving(true);
setError("");
setSuccess("");

try {
  const isEditing = editingBus !== null;

  const response = await fetch("/api/admin/buses", {
    method: isEditing ? "PUT" : "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...(isEditing ? { id: editingBus.id } : {}),
      name,
      plateNumber,
      seatCount,
      status: form.status,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(
      data.message ||
        (isEditing ? "Failed to update bus." : "Failed to create bus."),
    );
  }

  setModalOpen(false);
  setEditingBus(null);
  setForm(emptyForm);
  setSuccess(
    isEditing
      ? "Bus updated successfully."
      : "Bus added successfully.",
  );

  await loadBuses();
} catch (err) {
  setError(
    err instanceof Error ? err.message : "Something went wrong.",
  );
} finally {
  setSaving(false);
}


}

return ( <div className="space-y-8">
{/* Page heading */} <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"> <div> <p className="text-sm font-semibold text-violet-600">
BusGo Administration </p> <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
Bus Management </h1> <p className="mt-2 text-sm text-slate-500">
Manage your fleet, seating capacity, and bus availability. </p> </div>

    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={() => void loadBuses()}
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
      >
        <RefreshCw
          size={16}
          className={loading ? "animate-spin" : ""}
        />
        Refresh
      </button>

      <button
        type="button"
        onClick={openAddModal}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
      >
        <Plus size={18} />
        Add New Bus
      </button>
    </div>
  </div>

  {/* Notifications */}
  {error && !modalOpen && (
    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <AlertCircle size={19} className="mt-0.5 shrink-0" />
      <p>{error}</p>
    </div>
  )}

  {success && (
    <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
      <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
      <p>{success}</p>
    </div>
  )}

  {/* Summary cards */}
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <SummaryCard
      title="Total Buses"
      value={buses.length}
      icon={<BusFront size={22} />}
      style="bg-violet-100 text-violet-700"
    />

    <SummaryCard
      title="Active Buses"
      value={activeCount}
      icon={<CheckCircle2 size={22} />}
      style="bg-emerald-100 text-emerald-700"
    />

    <SummaryCard
      title="Maintenance"
      value={maintenanceCount}
      icon={<Wrench size={22} />}
      style="bg-amber-100 text-amber-700"
    />

    <SummaryCard
      title="Total Seats"
      value={totalSeats}
      icon={<Users size={22} />}
      style="bg-blue-100 text-blue-700"
    />
  </div>

  {/* Bus table */}
  <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 className="text-lg font-bold text-slate-900">
          Registered Buses
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Showing {filteredBuses.length} of {buses.length} buses
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search bus or plate..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10 sm:w-64"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter buses by status"
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500"
        >
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="MAINTENANCE">Maintenance</option>
        </select>
      </div>
    </div>

    {loading ? (
      <div className="flex items-center justify-center gap-3 p-16 text-sm text-slate-500">
        <RefreshCw size={18} className="animate-spin" />
        Loading buses...
      </div>
    ) : error && buses.length === 0 ? (
      <div className="p-10 text-center text-sm text-red-600">
        Unable to load buses. Use Refresh to try again.
      </div>
    ) : filteredBuses.length === 0 ? (
      <div className="flex flex-col items-center justify-center p-16 text-center">
        <BusFront size={36} className="mb-4 text-slate-300" />
        <h3 className="font-semibold text-slate-900">No buses found</h3>
        <p className="mt-1 text-sm text-slate-500">
          Change your search or add a new bus.
        </p>
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-4 font-semibold">Bus</th>
              <th className="px-5 py-4 font-semibold">Plate Number</th>
              <th className="px-5 py-4 font-semibold">Seat Capacity</th>
              <th className="px-5 py-4 font-semibold">Schedules</th>
              <th className="px-5 py-4 font-semibold">Status</th>
              <th className="px-5 py-4 font-semibold">Registered</th>
              <th className="px-5 py-4 font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {filteredBuses.map((bus) => (
              <tr
                key={bus.id}
                className="transition hover:bg-slate-50/80"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                      <BusFront size={21} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {bus.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Fleet vehicle
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-5 py-4">
                  <span className="rounded-lg bg-slate-100 px-3 py-1.5 font-mono text-xs font-semibold text-slate-700">
                    {bus.plateNumber}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Users size={16} className="text-slate-400" />
                    <span className="font-semibold">
                      {bus.seatCount}
                    </span>
                    <span className="text-slate-400">seats</span>
                  </div>
                </td>

                <td className="px-5 py-4">
                  <div className="flex items-center gap-2 text-slate-600">
                    <CalendarDays
                      size={16}
                      className="text-slate-400"
                    />
                    {bus.scheduleCount}
                  </div>
                </td>

                <td className="px-5 py-4">
                  <StatusBadge status={bus.status} />
                </td>

                <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                  {new Date(bus.createdAt).toLocaleDateString("en-ET", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>

                <td className="px-5 py-4">
                  <button
                    type="button"
                    title={`Edit ${bus.name}`}
                    onClick={() => openEditModal(bus)}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

    <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4 text-xs text-slate-500">
      Bus information is loaded from your PostgreSQL database.
    </div>
  </section>

  {/* Add/Edit bus modal */}
  {modalOpen && (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          closeModal();
        }
      }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {editingBus ? "Edit Bus" : "Add New Bus"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {editingBus
                ? "Update this vehicle's information."
                : "Enter the new vehicle information."}
            </p>
          </div>

          <button
            type="button"
            aria-label="Close form"
            disabled={saving}
            onClick={closeModal}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSaveBus} className="space-y-5 p-6">
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <Ban size={17} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label
              htmlFor="busName"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Bus Name
            </label>
            <input
              id="busName"
              required
              maxLength={100}
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              placeholder="e.g. Selam Bus"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
            />
          </div>

          <div>
            <label
              htmlFor="plateNumber"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Plate Number
            </label>
            <input
              id="plateNumber"
              required
              maxLength={30}
              value={form.plateNumber}
              onChange={(event) =>
                setForm({
                  ...form,
                  plateNumber: event.target.value,
                })
              }
              placeholder="e.g. 10-A12345"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
            />
          </div>

          <div>
            <label
              htmlFor="seatCount"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Seat Capacity
            </label>
            <input
              id="seatCount"
              type="number"
              required
              min={1}
              max={200}
              step={1}
              value={form.seatCount}
              onChange={(event) =>
                setForm({ ...form, seatCount: event.target.value })
              }
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
            />
            <p className="mt-1 text-xs text-slate-400">
              Enter a whole number between 1 and 200.
            </p>
          </div>

          <div>
            <label
              htmlFor="busStatus"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Bus Status
            </label>
            <select
              id="busStatus"
              value={form.status}
              onChange={(event) =>
                setForm({
                  ...form,
                  status: event.target.value as BusStatus,
                })
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={closeModal}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving && (
                <RefreshCw size={16} className="animate-spin" />
              )}
              {saving
                ? "Saving..."
                : editingBus
                  ? "Update Bus"
                  : "Save Bus"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )}
</div>

);
}

function SummaryCard({
title,
value,
icon,
style,
}: {
title: string;
value: number;
icon: React.ReactNode;
style: string;
}) {
return ( <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"> <div className="flex items-start justify-between gap-4"> <div> <p className="text-sm font-medium text-slate-500">{title}</p> <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
{value.toLocaleString()} </p> </div>
<div className={`rounded-xl p-3 ${style}`}>{icon}</div> </div> </div>
);
}
