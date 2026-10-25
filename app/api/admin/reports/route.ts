import { NextResponse } from "next/server";
import { PaymentStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-auth";

function parseDate(value: string | null, endOfDay = false): Date | null {
if (!value) return null;

// Require the exact YYYY-MM-DD format.
if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
return null;
}

const date = new Date(
`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`,
);

// Reject invalid dates, including impossible calendar dates.
if (
Number.isNaN(date.getTime()) ||
date.toISOString().slice(0, 10) !== value
) {
return null;
}

return date;
}

export async function GET(request: Request) {
try {
// Keep administrator authorization enabled.
const auth = await requireAdminApi();

if (!auth.authorized) {
  return auth.response;
}

const { searchParams } = new URL(request.url);

const startDate = parseDate(searchParams.get("startDate"));
const endDate = parseDate(searchParams.get("endDate"), true);

if (
  (searchParams.has("startDate") && !startDate) ||
  (searchParams.has("endDate") && !endDate)
) {
  return NextResponse.json(
    {
      success: false,
      message: "Invalid date. Use a valid YYYY-MM-DD date.",
    },
    { status: 400 },
  );
}

if (startDate && endDate && startDate > endDate) {
  return NextResponse.json(
    {
      success: false,
      message: "Start date cannot be after end date.",
    },
    { status: 400 },
  );
}

const dateFilter = {
  ...(startDate ? { gte: startDate } : {}),
  ...(endDate ? { lte: endDate } : {}),
};

const paymentWhere = {
  ...(startDate || endDate ? { createdAt: dateFilter } : {}),
};

const bookingWhere = {
  ...(startDate || endDate ? { createdAt: dateFilter } : {}),
};

const [
  paymentGroups,
  totalPayments,
  bookingGroups,
  totalBookings,
  routePayments,
  dailyPayments,
] = await Promise.all([
  db.payment.groupBy({
    by: ["status"],
    where: paymentWhere,
    _count: { _all: true },
    _sum: { amount: true },
  }),

  db.payment.count({ where: paymentWhere }),

  db.booking.groupBy({
    by: ["status"],
    where: bookingWhere,
    _count: { _all: true },
  }),

  db.booking.count({ where: bookingWhere }),

  db.payment.findMany({
    where: {
      ...paymentWhere,
      status: PaymentStatus.PAID,
    },
    select: {
      amount: true,
      booking: {
        select: {
          schedule: {
            select: {
              route: {
                select: {
                  origin: true,
                  destination: true,
                },
              },
            },
          },
        },
      },
    },
  }),

  db.payment.findMany({
    where: {
      ...paymentWhere,
      status: PaymentStatus.PAID,
    },
    select: {
      amount: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  }),
]);

const paymentSummary: Record<
  string,
  { count: number; amount: number }
> = {
  PAID: { count: 0, amount: 0 },
  PENDING: { count: 0, amount: 0 },
  FAILED: { count: 0, amount: 0 },
  REFUNDED: { count: 0, amount: 0 },
};

for (const group of paymentGroups) {
  paymentSummary[group.status] = {
    count: group._count._all,
    amount: Number(group._sum.amount ?? 0),
  };
}

const bookingSummary: Record<string, number> = {
  PENDING: 0,
  CONFIRMED: 0,
  CANCELLED: 0,
  COMPLETED: 0,
};

for (const group of bookingGroups) {
  bookingSummary[group.status] = group._count._all;
}

const revenueByRoute = new Map<
  string,
  {
    origin: string;
    destination: string;
    revenue: number;
    payments: number;
  }
>();

for (const payment of routePayments) {
  const route = payment.booking.schedule.route;
  const key = `${route.origin}|||${route.destination}`;

  const current = revenueByRoute.get(key) ?? {
    origin: route.origin,
    destination: route.destination,
    revenue: 0,
    payments: 0,
  };

  current.revenue += Number(payment.amount);
  current.payments += 1;

  revenueByRoute.set(key, current);
}

// Group daily revenue consistently by UTC calendar date.
const dailyRevenue = new Map<string, number>();

for (const payment of dailyPayments) {
  const day = payment.createdAt.toISOString().slice(0, 10);

  dailyRevenue.set(
    day,
    (dailyRevenue.get(day) ?? 0) + Number(payment.amount),
  );
}

const routes = Array.from(revenueByRoute.values()).sort(
  (a, b) => b.revenue - a.revenue,
);

const daily = Array.from(dailyRevenue.entries())
  .map(([date, revenue]) => ({ date, revenue }))
  .sort((a, b) => a.date.localeCompare(b.date));

return NextResponse.json({
  success: true,
  filters: {
    startDate: startDate?.toISOString() ?? null,
    endDate: endDate?.toISOString() ?? null,
  },
  stats: {
    totalRevenue: paymentSummary.PAID.amount,
    totalBookings,
    totalPayments,
    paidPayments: paymentSummary.PAID.count,
    pendingPayments: paymentSummary.PENDING.count,
    failedPayments: paymentSummary.FAILED.count,
    refundedPayments: paymentSummary.REFUNDED.count,
  },
  paymentSummary,
  bookingSummary,
  revenueByRoute: routes,
  dailyRevenue: daily,
});

} catch (error) {
console.error("Admin reports API error:", error);

return NextResponse.json(
  {
    success: false,
    message: "Unable to generate revenue reports.",
  },
  { status: 500 },
);

}
}
