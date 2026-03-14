export default function GlobalLoading() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-8 animate-pulse" aria-busy="true" aria-live="polite">
      <section className="mb-8 rounded-2xl border border-zinc-900 bg-gradient-to-br from-zinc-950 via-zinc-950 to-black p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
          <div>
            <div className="h-3 w-36 rounded bg-zinc-800 mb-4" />
            <div className="h-11 w-80 max-w-full rounded bg-zinc-900 mb-4" />
            <div className="h-6 w-56 rounded bg-zinc-900 mb-6" />
            <div className="h-10 w-44 rounded-md bg-[#ccff00]/70" />
          </div>
          <div className="border-t border-zinc-900 md:border-t-0 md:border-l md:border-zinc-900 md:pl-8 pt-5 md:pt-0">
            <div className="h-3 w-32 rounded bg-zinc-800 mb-4" />
            <div className="space-y-2">
              <div className="h-11 rounded-lg bg-zinc-900 border border-zinc-800" />
              <div className="h-11 rounded-lg bg-zinc-900 border border-zinc-800" />
              <div className="h-11 rounded-lg bg-zinc-900 border border-zinc-800" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-3">
          <div className="h-6 w-48 rounded bg-zinc-800" />
          <div className="h-16 rounded-lg bg-zinc-950" />
          <div className="h-16 rounded-lg bg-zinc-950" />
          <div className="h-16 rounded-lg bg-zinc-950" />
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-3">
          <div className="h-6 w-40 rounded bg-zinc-800" />
          <div className="h-16 rounded-lg bg-zinc-950" />
          <div className="h-16 rounded-lg bg-zinc-950" />
          <div className="h-16 rounded-lg bg-zinc-950" />
        </div>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-3">
        <div className="h-7 w-72 rounded bg-zinc-800" />
        <div className="h-10 rounded-lg bg-zinc-950" />
        <div className="h-10 rounded-lg bg-zinc-950" />
        <div className="h-10 rounded-lg bg-zinc-950" />
        <div className="h-10 rounded-lg bg-zinc-950" />
      </section>
    </main>
  );
}
