"use client";

import { NoActiveChampionshipBlock } from "@/app/components/championship/NoActiveChampionshipBlock";
import { Loader } from "@/app/components/ui/Loader";
import { useChampionshipsCatalog } from "@/app/hooks/useChampionshipsCatalog";

interface NoActiveClientGateProps {
  children: React.ReactNode;
}

export function NoActiveClientGate({ children }: NoActiveClientGateProps) {
  const { current, preseasonNews, isLoading, hasLoaded } = useChampionshipsCatalog();
  const hasActive = Boolean(current);

  if (isLoading && !hasLoaded) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-12">
        <Loader />
      </main>
    );
  }

  if (!hasActive) {
    return <NoActiveChampionshipBlock news={preseasonNews} />;
  }

  return <>{children}</>;
}
