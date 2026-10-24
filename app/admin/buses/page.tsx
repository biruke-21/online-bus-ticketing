export default function AdminBusesPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-3xl font-bold text-slate-900">Bus management</h1>
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-4 py-3">Bus</th>
                <th className="px-4 py-3">Plate</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-slate-200">
                <td className="px-4 py-3">Deluxe Coach</td>
                <td className="px-4 py-3">ET-2134</td>
                <td className="px-4 py-3 text-emerald-600">Available</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
