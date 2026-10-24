import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-2xl font-bold text-blue-700">
            BusGo
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="/search"
              className="text-sm font-medium text-slate-600 hover:text-blue-700"
            >
              Search Buses
            </Link>

            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-blue-700"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Create Account
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-blue-700">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-2 lg:items-center lg:py-28">
          <div className="text-white">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-blue-200">
              Simple. Fast. Reliable.
            </p>

            <h1 className="max-w-2xl text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Book your bus ticket with confidence.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-blue-100">
              Find available buses, choose your preferred seat, pay securely,
              and receive your digital ticket instantly.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/search"
                className="rounded-lg bg-white px-6 py-3 font-semibold text-blue-700 hover:bg-blue-50"
              >
                Find a Bus
              </Link>

              <Link
                href="/register"
                className="rounded-lg border border-blue-300 px-6 py-3 font-semibold text-white hover:bg-blue-600"
              >
                Create Account
              </Link>
            </div>
          </div>

          {/* Search card */}
          <div className="rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-900">
              Search for a bus
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Choose your route and travel date.
            </p>

            <form className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="from"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  From
                </label>

                <input
                  id="from"
                  type="text"
                  placeholder="e.g. Addis Ababa"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="to"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  To
                </label>

                <input
                  id="to"
                  type="text"
                  placeholder="e.g. Bahir Dar"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="date"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Travel date
                </label>

                <input
                  id="date"
                  type="date"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <Link
                href="/search"
                className="block w-full rounded-lg bg-blue-700 px-5 py-3 text-center font-semibold text-white hover:bg-blue-800"
              >
                Search Buses
              </Link>
            </form>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
            Why BusGo?
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            Everything you need for your journey
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <FeatureCard
            title="Easy Search"
            description="Find buses by route and travel date without complicated steps."
            icon="🔎"
          />

          <FeatureCard
            title="Choose Your Seat"
            description="See the available seats and select the one you prefer."
            icon="💺"
          />

          <FeatureCard
            title="Digital Ticket"
            description="Get your booking confirmation and QR ticket after payment."
            icon="🎫"
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white">
  <div className="mx-auto max-w-7xl px-4 py-6 text-center text-sm text-gray-500">
    © 2026 BusGo. All rights reserved.
  </div>
</footer>
    </main>
  );
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-3xl">{icon}</div>

      <h3 className="mt-4 text-lg font-bold text-slate-900">{title}</h3>

      <p className="mt-2 leading-7 text-slate-600">{description}</p>
    </div>
  );
}