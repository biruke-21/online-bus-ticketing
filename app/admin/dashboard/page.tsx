export default function AdminDashboardPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold text-slate-900">Admin dashboard</h1>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Total buses</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">24</p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Daily bookings</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">184</p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Revenue</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">$12.8k</p>
          </div>
        </div>
      </div>
    </main>
  );
}
