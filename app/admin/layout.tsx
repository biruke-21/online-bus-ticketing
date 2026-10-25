
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BusFront,
  Route,
  CalendarDays,
  ClipboardList,
  CreditCard,
  ScanLine,
  Settings,
  LogOut,
  Menu,
  X,
  Ticket,
} from "lucide-react";
import { useState } from "react";

const navigation = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Buses",
    href: "/admin/buses",
    icon: BusFront,
  },
  {
    label: "Routes",
    href: "/admin/routes",
    icon: Route,
  },
  {
    label: "Schedules",
    href: "/admin/schedules",
    icon: CalendarDays,
  },
  {
    label: "Bookings",
    href: "/admin/bookings",
    icon: ClipboardList,
  },
  {
    label: "Payments",
    href: "/admin/payments",
    icon: CreditCard,
  },
  {
    label: "Tickets",
    href: "/scan-ticket",
    icon: ScanLine,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#21143F] text-white transition-transform duration-300 lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
          <Link
            href="/admin"
            className="flex items-center gap-3"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500">
              <BusFront size={23} />
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-wide">BusGo</h1>
              <p className="text-xs text-violet-200">Admin Panel</p>
            </div>
          </Link>

          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-lg p-2 text-white/70 hover:bg-white/10 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
          <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-widest text-violet-300">
            Main Menu
          </p>

          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-violet-500 text-white shadow-lg shadow-violet-950/30"
                    : "text-violet-100/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="space-y-2 border-t border-white/10 p-4">
          <Link
            href="/admin/settings"
            className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-violet-100/75 transition hover:bg-white/10 hover:text-white ${
              pathname.startsWith("/admin/settings") ? "bg-white/10 text-white" : ""
            }`}
          >
            <Settings size={19} />
            Settings
          </Link>

          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-violet-100/75 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut size={19} />
            Back to Website
          </Link>

          <div className="mt-4 flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-400 font-bold text-white">
              A
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Administrator</p>
              <p className="text-xs text-violet-200">BusGo Management</p>
            </div>
            <Ticket size={18} className="ml-auto shrink-0 text-violet-300" />
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="min-h-screen lg:pl-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:hidden">
          <button
            type="button"
            aria-label="Open navigation"
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-lg border border-slate-200 p-2 hover:bg-slate-100"
          >
            <Menu size={20} />
          </button>

          <span className="font-bold text-[#21143F]">BusGo Admin</span>
        </header>

        {/* Page content */}
        <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}