import { Skeleton } from "@/app/components/ui/Skeleton";

export function ChampionshipTabsSkeleton() {
  return (
    <div className="mb-6 flex gap-2 flex-wrap">
      <Skeleton className="h-10 w-36 rounded-lg" />
      <Skeleton className="h-10 w-40 rounded-lg" />
    </div>
  );
}

export function StagesGridSkeleton() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-8" aria-busy="true" aria-live="polite">
      <div className="mb-8 space-y-2">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-5 w-64" />
      </div>
      <ChampionshipTabsSkeleton />
      <section className="space-y-10">
        <div>
          <div className="mb-4 space-y-2">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-60" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={`upcoming-${index}`} className="h-52 rounded-xl" />
            ))}
          </div>
        </div>
        <div>
          <div className="mb-4 space-y-2">
            <Skeleton className="h-7 w-52" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={`archive-${index}`} className="h-52 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export function StatsPageSkeleton() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-8" aria-busy="true" aria-live="polite">
      <div className="mb-6 space-y-2">
        <Skeleton className="h-9 w-80" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>
      <ChampionshipTabsSkeleton />
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={`stats-${index}`} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-48" />
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
            </div>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ))}
      </section>
    </main>
  );
}

export function DetailPageSkeleton() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-8" aria-busy="true" aria-live="polite">
      <Skeleton className="h-5 w-40 mb-6" />
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 mb-6 flex items-center gap-5">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="ml-auto space-y-2 text-right">
          <Skeleton className="h-10 w-20 ml-auto" />
          <Skeleton className="h-4 w-24 ml-auto" />
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={`detail-${index}`} className="h-16 rounded-lg" />
        ))}
      </div>
    </main>
  );
}
