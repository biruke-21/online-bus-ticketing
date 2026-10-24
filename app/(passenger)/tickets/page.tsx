export default function TicketsPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-3xl font-bold text-slate-900">My tickets</h1>
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">Ticket #BUS-1024</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">
              Addis Ababa → Bahir Dar
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">Ticket #BUS-1025</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">
              Hawassa → Adama
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
