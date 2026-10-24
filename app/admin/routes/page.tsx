export default function AdminRoutesPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-3xl font-bold text-slate-900">Route management</h1>
        <ul className="mt-6 space-y-3">
          <li className="rounded-xl border border-slate-200 p-4">
            Addis Ababa → Bahir Dar
          </li>
          <li className="rounded-xl border border-slate-200 p-4">
            Addis Ababa → Hawassa
          </li>
          <li className="rounded-xl border border-slate-200 p-4">
            Dire Dawa → Mekelle
          </li>
        </ul>
      </div>
    </main>
  );
}
