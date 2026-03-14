"use client";

import { useEffect, useState } from "react";
import { NoActiveChampionshipBlock } from "@/app/components/championship/NoActiveChampionshipBlock";
import { Loader } from "@/app/components/ui/Loader";

interface NoActiveClientGateProps {
  children: React.ReactNode;
}

export function NoActiveClientGate({ children }: NoActiveClientGateProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasActive, setHasActive] = useState(true);
  const [news, setNews] = useState("");

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const res = await fetch("/api/championships");
        const data = (await res.json().catch(() => ({}))) as {
          current?: unknown;
          preseasonNews?: string;
        };
        setHasActive(Boolean(data.current));
        setNews(data.preseasonNews ?? "");
      } catch {
        setHasActive(true);
      } finally {
        setIsLoading(false);
      }
    };

    void loadStatus();
  }, []);

  if (isLoading) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-12">
        <Loader />
      </main>
    );
  }

  if (!hasActive) {
    return <NoActiveChampionshipBlock news={news} />;
  }

  return <>{children}</>;
}
