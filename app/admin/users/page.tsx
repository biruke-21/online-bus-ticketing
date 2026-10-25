
"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  Search,
  Users,
  UserCheck,
  ShieldCheck,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  CalendarDays,
  Ticket,
  Shield,
  UserRound,
  AlertCircle,
  LoaderCircle,
  Save,
  CheckCircle2,
  UserX,
  UserRoundCheck,
} from "lucide-react";

type UserRole = "PASSENGER" | "ADMIN";
type UserStatus = "ALL" | "ACTIVE" | "INACTIVE";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  totalBookings: number;
};

type UserStatistics = {
  totalUsers: number;
  totalPassengers: number;
  totalAdmins: number;
  totalActiveUsers: number;
  totalInactiveUsers: number;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type UserForm = {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
};

const EMPTY_STATISTICS: UserStatistics = {
  totalUsers: 0,
  totalPassengers: 0,
  totalAdmins: 0,
  totalActiveUsers: 0,
  totalInactiveUsers: 0,
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [statistics, setStatistics] =
    useState<UserStatistics>(EMPTY_STATISTICS);

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] =
    useState<UserStatus>("ALL");

  const [selectedUser, setSelectedUser] =
    useState<AdminUser | null>(null);
  const [editingUser, setEditingUser] =
    useState<AdminUser | null>(null);

  const [form, setForm] = useState<UserForm>({
    name: "",
    email: "",
    phone: "",
    role: "PASSENGER",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingUserId, setDeletingUserId] =
    useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] =
    useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Debounce search input.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
        status: statusFilter,
      });

      if (search) {
        params.set("search", search);
      }

      if (roleFilter !== "ALL") {
        params.set("role", roleFilter);
      }

      const response = await fetch(
        `/api/admin/users?${params.toString()}`,
        { cache: "no-store" },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load users.",
        );
      }

      setUsers(data.users ?? []);
      setStatistics({
        ...EMPTY_STATISTICS,
        ...data.statistics,
      });

      setPagination((previous) => ({
        ...previous,
        ...data.pagination,
      }));

      // Keep an open details modal synchronized with the list.
      if (selectedUser) {
        const refreshedUser = (
          data.users as AdminUser[]
        ).find((user) => user.id === selectedUser.id);

        if (refreshedUser) {
          setSelectedUser(refreshedUser);
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load users.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    search,
    roleFilter,
    statusFilter,
    selectedUser,
  ]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  // Reset pagination when filters change.
  useEffect(() => {
    setPagination((previous) =>
      previous.page === 1
        ? previous
        : { ...previous, page: 1 },
    );
  }, [search, roleFilter, statusFilter]);

  function formatDate(date: string) {
    return new Intl.DateTimeFormat("en", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  }

  function initials(name: string) {
    return (
      name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "U"
    );
  }

  function changePage(nextPage: number) {
    if (
      nextPage < 1 ||
      nextPage > Math.max(1, pagination.totalPages)
    ) {
      return;
    }

    setPagination((previous) => ({
      ...previous,
      page: nextPage,
    }));
  }

  function openEditModal(user: AdminUser) {
    setEditingUser(user);

    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone ?? "",
      role: user.role,
    });

    setError("");
    setSuccess("");
  }

  function closeEditModal() {
    if (saving) return;

    setEditingUser(null);
    setError("");
  }

  async function handleSaveUser(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!editingUser) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingUser.id,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          role: form.role,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to update user.",
        );
      }

      setEditingUser(null);
      setSuccess("User updated successfully.");

      await fetchUsers();

      if (selectedUser?.id === editingUser.id && data.user) {
        setSelectedUser(data.user);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update user.",
      );
    } finally {
      setSaving(false);
    }
  }

  // Activate or deactivate a user without deleting their history.
  async function handleToggleUserStatus(user: AdminUser) {
    if (statusUpdatingId || deletingUserId) return;

    const nextActiveStatus = !user.isActive;
    const action = nextActiveStatus
      ? "reactivate"
      : "deactivate";

    const confirmed = window.confirm(
      nextActiveStatus
        ? `Reactivate "${user.name}"?\n\nThis will mark the account as active.`
        : `Deactivate "${user.name}"?\n\nTheir account will be marked inactive. Their booking history will be preserved.`,
    );

    if (!confirmed) return;

    setStatusUpdatingId(user.id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: user.id,
          isActive: nextActiveStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            `Failed to ${action} this account.`,
        );
      }

      setSuccess(
        data.message ||
          `User ${nextActiveStatus ? "reactivated" : "deactivated"} successfully.`,
      );

      if (selectedUser?.id === user.id) {
        setSelectedUser((previous) =>
          previous
            ? { ...previous, isActive: nextActiveStatus }
            : null,
        );
      }

      await fetchUsers();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to ${action} this account.`,
      );
    } finally {
      setStatusUpdatingId(null);
    }
  }

  async function handleDeleteUser(user: AdminUser) {
    if (deletingUserId || statusUpdatingId) return;

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${user.name}"?\n\nThis cannot be undone. If the user has bookings, deactivate the account instead to preserve their history.`,
    );

    if (!confirmed) return;

    setDeletingUserId(user.id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: user.id }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to delete user.",
        );
      }

      if (selectedUser?.id === user.id) {
        setSelectedUser(null);
      }

      if (editingUser?.id === user.id) {
        setEditingUser(null);
      }

      setSuccess(
        data.message || "User deleted successfully.",
      );

      await fetchUsers();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete user.",
      );
    } finally {
      setDeletingUserId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#09090f] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-8">
        {/* Header */}
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm text-violet-400">
              <Users size={16} />
              <span>Administration / Users</span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              User Management
            </h1>

            <p className="mt-2 text-sm text-gray-400 sm:text-base">
              Manage registered passengers and administrator accounts.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void fetchUsers()}
            disabled={loading || Boolean(statusUpdatingId) || Boolean(deletingUserId)}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium transition hover:bg-white/[0.08] disabled:opacity-50 sm:self-center"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </header>

        {/* Success notification */}
        {success && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] p-4 text-sm text-emerald-300">
            <CheckCircle2 size={19} />
            <span>{success}</span>

            <button
              type="button"
              onClick={() => setSuccess("")}
              className="ml-auto rounded-lg p-1 hover:bg-white/5"
              aria-label="Dismiss notification"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* Error notification */}
        {error && !editingUser && (
          <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.07] p-4 text-sm text-red-300">
            <AlertCircle size={19} className="mt-0.5 shrink-0" />

            <div>
              <p className="font-semibold">Something went wrong</p>
              <p className="mt-1">{error}</p>

              <button
                type="button"
                onClick={() => {
                  setError("");
                  void fetchUsers();
                }}
                className="mt-3 underline underline-offset-4"
              >
                Try again
              </button>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              className="ml-auto rounded-lg p-1 hover:bg-white/5"
              aria-label="Dismiss error"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* Statistics */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title="Total Users"
            value={statistics.totalUsers}
            icon={<Users size={21} />}
            description="All registered accounts"
          />

          <StatCard
            title="Passengers"
            value={statistics.totalPassengers}
            icon={<UserCheck size={21} />}
            description="Passenger accounts"
          />

          <StatCard
            title="Administrators"
            value={statistics.totalAdmins}
            icon={<ShieldCheck size={21} />}
            description="Admin accounts"
          />

          <StatCard
            title="Active Users"
            value={statistics.totalActiveUsers}
            icon={<UserRoundCheck size={21} />}
            description="Currently active accounts"
          />

          <StatCard
            title="Inactive Users"
            value={statistics.totalInactiveUsers}
            icon={<UserX size={21} />}
            description="Deactivated accounts"
          />
        </section>

        {/* Users table */}
        <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111119]">
          <div className="flex flex-col gap-4 border-b border-white/[0.08] p-5">
            <div>
              <h2 className="text-lg font-semibold">
                Registered Users
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Search, review, edit, activate, deactivate, and manage accounts.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div className="relative min-w-0">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) =>
                    setSearchInput(event.target.value)
                  }
                  placeholder="Search name, email, phone..."
                  className="w-full rounded-xl border border-white/10 bg-[#09090f] py-3 pl-10 pr-4 text-sm outline-none placeholder:text-gray-600 focus:border-violet-500"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(event) =>
                  setRoleFilter(event.target.value)
                }
                aria-label="Filter users by role"
                className="rounded-xl border border-white/10 bg-[#09090f] px-4 py-3 text-sm text-gray-300 outline-none focus:border-violet-500"
              >
                <option value="ALL">All roles</option>
                <option value="PASSENGER">Passengers</option>
                <option value="ADMIN">Administrators</option>
              </select>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as UserStatus)
                }
                aria-label="Filter users by account status"
                className="rounded-xl border border-white/10 bg-[#09090f] px-4 py-3 text-sm text-gray-300 outline-none focus:border-violet-500"
              >
                <option value="ALL">All account statuses</option>
                <option value="ACTIVE">Active users</option>
                <option value="INACTIVE">Inactive users</option>
              </select>
            </div>
          </div>

          {loading && users.length === 0 && !error ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-gray-400">
              <LoaderCircle
                size={30}
                className="animate-spin text-violet-400"
              />
              <p className="text-sm">Loading users...</p>
            </div>
          ) : !loading && !error && users.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
              <Users size={32} className="mb-4 text-gray-500" />
              <h3 className="font-semibold">No users found</h3>
              <p className="mt-2 text-sm text-gray-500">
                Try changing your search or filters.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1150px] text-left">
                  <thead className="bg-white/[0.025]">
                    <tr className="border-b border-white/[0.07] text-xs uppercase tracking-wider text-gray-500">
                      <th className="px-6 py-4 font-medium">User</th>
                      <th className="px-6 py-4 font-medium">Phone</th>
                      <th className="px-6 py-4 font-medium">Role</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium">Bookings</th>
                      <th className="px-6 py-4 font-medium">Joined</th>
                      <th className="px-6 py-4 text-right font-medium">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/[0.06]">
                    {users.map((user) => {
                      const isUpdatingStatus =
                        statusUpdatingId === user.id;
                      const isDeleting =
                        deletingUserId === user.id;
                      const rowBusy =
                        Boolean(statusUpdatingId) ||
                        Boolean(deletingUserId);

                      return (
                        <tr
                          key={user.id}
                          className={`transition hover:bg-white/[0.025] ${
                            !user.isActive ? "opacity-75" : ""
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/10 text-sm font-bold text-violet-300">
                                {initials(user.name)}
                              </div>

                              <div className="min-w-0">
                                <p className="max-w-[220px] truncate font-medium">
                                  {user.name}
                                </p>

                                <p className="mt-1 max-w-[220px] truncate text-sm text-gray-500">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 text-sm text-gray-400">
                            {user.phone || "Not provided"}
                          </td>

                          <td className="px-6 py-4">
                            <RoleBadge role={user.role} />
                          </td>

                          <td className="px-6 py-4">
                            <StatusBadge isActive={user.isActive} />
                          </td>

                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-2 text-sm text-gray-300">
                              <Ticket size={15} className="text-gray-500" />
                              {user.totalBookings}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-sm text-gray-400">
                            {formatDate(user.createdAt)}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedUser(user)}
                                title="View details"
                                aria-label={`View ${user.name}`}
                                disabled={rowBusy}
                                className="rounded-lg border border-white/10 p-2.5 text-gray-300 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
                              >
                                <Eye size={16} />
                              </button>

                              <button
                                type="button"
                                onClick={() => openEditModal(user)}
                                title="Edit user"
                                aria-label={`Edit ${user.name}`}
                                disabled={rowBusy}
                                className="rounded-lg border border-violet-400/20 bg-violet-500/10 p-2.5 text-violet-300 transition hover:bg-violet-500/20 disabled:opacity-40"
                              >
                                <Pencil size={16} />
                              </button>

                              <button
                                type="button"
                                onClick={() => void handleToggleUserStatus(user)}
                                title={user.isActive ? "Deactivate user" : "Reactivate user"}
                                aria-label={`${user.isActive ? "Deactivate" : "Reactivate"} ${user.name}`}
                                disabled={rowBusy}
                                className={`inline-flex min-w-28 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                                  user.isActive
                                    ? "border-amber-400/20 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                                    : "border-emerald-400/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                                }`}
                              >
                                {isUpdatingStatus ? (
                                  <LoaderCircle size={15} className="animate-spin" />
                                ) : user.isActive ? (
                                  <UserX size={15} />
                                ) : (
                                  <UserRoundCheck size={15} />
                                )}

                                {isUpdatingStatus
                                  ? "Updating..."
                                  : user.isActive
                                    ? "Deactivate"
                                    : "Reactivate"}
                              </button>

                              <button
                                type="button"
                                onClick={() => void handleDeleteUser(user)}
                                title="Delete user"
                                aria-label={`Delete ${user.name}`}
                                disabled={rowBusy}
                                className="rounded-lg border border-red-400/20 bg-red-500/10 p-2.5 text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {isDeleting ? (
                                  <LoaderCircle size={16} className="animate-spin" />
                                ) : (
                                  <Trash2 size={16} />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-4 border-t border-white/[0.08] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  {pagination.total === 0
                    ? "No users"
                    : `Showing ${
                        (pagination.page - 1) * pagination.limit + 1
                      }–${Math.min(
                        pagination.page * pagination.limit,
                        pagination.total,
                      )} of ${pagination.total} users`}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => changePage(pagination.page - 1)}
                    disabled={pagination.page <= 1 || loading}
                    aria-label="Previous page"
                    className="rounded-lg border border-white/10 p-2 text-gray-400 hover:bg-white/[0.05] disabled:opacity-30"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <span className="min-w-24 text-center text-sm text-gray-300">
                    Page {pagination.page} of {Math.max(1, pagination.totalPages)}
                  </span>

                  <button
                    type="button"
                    onClick={() => changePage(pagination.page + 1)}
                    disabled={
                      pagination.page >= pagination.totalPages || loading
                    }
                    aria-label="Next page"
                    className="rounded-lg border border-white/10 p-2 text-gray-400 hover:bg-white/[0.05] disabled:opacity-30"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        <p className="text-center text-xs text-gray-600">
          BusGo Administration · User Management
        </p>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-user-title"
            className="my-auto w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#111119] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-5">
              <div>
                <h2 id="edit-user-title" className="text-lg font-semibold">
                  Edit User
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Update account information and role.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditModal}
                disabled={saving}
                aria-label="Close edit form"
                className="rounded-lg p-2 text-gray-400 hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-5 p-6">
              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.08] p-3 text-sm text-red-300">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label htmlFor="user-name" className="mb-2 block text-sm font-medium text-gray-300">
                  Full name
                </label>
                <input
                  id="user-name"
                  required
                  minLength={2}
                  maxLength={100}
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#09090f] px-4 py-3 text-sm outline-none focus:border-violet-500"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label htmlFor="user-email" className="mb-2 block text-sm font-medium text-gray-300">
                  Email address
                </label>
                <input
                  id="user-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(event) =>
                    setForm({ ...form, email: event.target.value })
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#09090f] px-4 py-3 text-sm outline-none focus:border-violet-500"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label htmlFor="user-phone" className="mb-2 block text-sm font-medium text-gray-300">
                  Phone number
                </label>
                <input
                  id="user-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(event) =>
                    setForm({ ...form, phone: event.target.value })
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#09090f] px-4 py-3 text-sm outline-none focus:border-violet-500"
                  placeholder="Enter phone number (optional)"
                />
              </div>

              <div>
                <label htmlFor="user-role" className="mb-2 block text-sm font-medium text-gray-300">
                  Account role
                </label>
                <select
                  id="user-role"
                  value={form.role}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      role: event.target.value as UserRole,
                    })
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#09090f] px-4 py-3 text-sm outline-none focus:border-violet-500"
                >
                  <option value="PASSENGER">Passenger</option>
                  <option value="ADMIN">Administrator</option>
                </select>
                <p className="mt-2 text-xs leading-5 text-amber-300/80">
                  Changing a role affects account privileges. Only authorized administrators should perform this action.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-white/[0.08] pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={saving}
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-gray-300 transition hover:bg-white/[0.05] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <LoaderCircle size={17} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedUser(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-details-title"
            className="my-auto w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#111119] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-5">
              <div>
                <h2 id="user-details-title" className="text-lg font-semibold">
                  User Details
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Account information
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                aria-label="Close user details"
                className="rounded-lg p-2 text-gray-400 hover:bg-white/[0.06] hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="flex flex-col items-center border-b border-white/[0.08] pb-6 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-2xl font-bold text-violet-300">
                  {initials(selectedUser.name)}
                </div>

                <h3 className="mt-4 text-xl font-semibold">
                  {selectedUser.name}
                </h3>

                <p className="mt-1 break-all text-sm text-gray-400">
                  {selectedUser.email}
                </p>

                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <RoleBadge role={selectedUser.role} />
                  <StatusBadge isActive={selectedUser.isActive} />
                </div>
              </div>

              <div className="space-y-5 py-6">
                <DetailRow
                  icon={<Mail size={18} />}
                  label="Email address"
                  value={selectedUser.email}
                />

                <DetailRow
                  icon={<Phone size={18} />}
                  label="Phone number"
                  value={selectedUser.phone || "Not provided"}
                />

                <DetailRow
                  icon={<CalendarDays size={18} />}
                  label="Registration date"
                  value={formatDate(selectedUser.createdAt)}
                />

                <DetailRow
                  icon={<Ticket size={18} />}
                  label="Total bookings"
                  value={String(selectedUser.totalBookings)}
                />

                <DetailRow
                  icon={<Shield size={18} />}
                  label="Account role"
                  value={
                    selectedUser.role === "ADMIN"
                      ? "Administrator"
                      : "Passenger"
                  }
                />

                <DetailRow
                  icon={<UserRound size={18} />}
                  label="Account status"
                  value={selectedUser.isActive ? "Active" : "Inactive"}
                />

                <DetailRow
                  icon={<UserRound size={18} />}
                  label="User ID"
                  value={selectedUser.id}
                  breakAll
                />
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => void handleToggleUserStatus(selectedUser)}
                  disabled={
                    Boolean(statusUpdatingId) ||
                    Boolean(deletingUserId)
                  }
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition disabled:opacity-50 ${
                    selectedUser.isActive
                      ? "border border-amber-400/20 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                      : "border border-emerald-400/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                  }`}
                >
                  {statusUpdatingId === selectedUser.id ? (
                    <LoaderCircle size={17} className="animate-spin" />
                  ) : selectedUser.isActive ? (
                    <UserX size={17} />
                  ) : (
                    <UserRoundCheck size={17} />
                  )}

                  {selectedUser.isActive ? "Deactivate User" : "Reactivate User"}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
                >
                  Close Details
                </button>

                <button
                  type="button"
                  onClick={() => void handleDeleteUser(selectedUser)}
                  disabled={
                    Boolean(statusUpdatingId) ||
                    Boolean(deletingUserId)
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
                >
                  {deletingUserId === selectedUser.id ? (
                    <LoaderCircle size={17} className="animate-spin" />
                  ) : (
                    <Trash2 size={17} />
                  )}
                  Delete User
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  description,
}: {
  title: string;
  value: number;
  icon: ReactNode;
  description: string;
}) {
  return (
    <article className="rounded-2xl border border-white/[0.08] bg-[#111119] p-5 transition hover:border-violet-400/20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight">
            {value.toLocaleString()}
          </p>
          <p className="mt-2 text-xs text-gray-500">{description}</p>
        </div>

        <div className="rounded-xl border border-violet-400/10 bg-violet-500/10 p-3 text-violet-300">
          {icon}
        </div>
      </div>
    </article>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const isAdmin = role === "ADMIN";

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${
        isAdmin
          ? "border-violet-400/20 bg-violet-500/10 text-violet-300"
          : "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
      }`}
    >
      {isAdmin ? <ShieldCheck size={13} /> : <UserRound size={13} />}
      {isAdmin ? "Administrator" : "Passenger"}
    </span>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${
        isActive
          ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
          : "border-red-400/20 bg-red-500/10 text-red-300"
      }`}
    >
      {isActive ? (
        <CheckCircle2 size={13} />
      ) : (
        <UserX size={13} />
      )}
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

function DetailRow({
  icon,
  label,
  value,
  breakAll = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  breakAll?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0 text-violet-300">{icon}</div>

      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500">{label}</p>
        <p
          className={`mt-1 text-sm text-gray-200 ${
            breakAll ? "break-all" : "break-words"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

