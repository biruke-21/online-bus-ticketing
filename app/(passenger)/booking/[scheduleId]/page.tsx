export default function SchedulePage() {
  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
          Bus schedule
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          Available trip details
        </h1>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">Route</p>
            <p className="mt-2 text-xl font-semibold">
              Addis Ababa → Bahir Dar
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">Departure</p>
            <p className="mt-2 text-xl font-semibold">08:30 AM</p>
          </div>
        </div>
      </div>
    </main>
  );
}
