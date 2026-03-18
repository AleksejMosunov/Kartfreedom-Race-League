interface NoActiveChampionshipBlockProps {
  news?: string | { sprint?: string; sprintPro?: string; };
}

export function NoActiveChampionshipBlock({ news }: NoActiveChampionshipBlockProps) {
  const sprintNews = typeof news === "string" ? news : (news?.sprint ?? "");
  const sprintProNews = typeof news === "string" ? "" : (news?.sprintPro ?? "");
  const hasNews = sprintNews.trim() || sprintProNews.trim();

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center">
        <h2 className="text-2xl font-black text-white mb-2">Немає активного чемпіонату</h2>
        <p className="text-zinc-400">
          Публічні розділи будуть доступні після старту нового чемпіонату.
        </p>
        {hasNews ? (
          <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-left">
            <p className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Новини</p>
            {sprintNews ? (
              <div className="mb-3">
                <p className="text-xs uppercase tracking-wide text-zinc-500 mb-1">Sprint</p>
                <p className="text-zinc-200 whitespace-pre-wrap">{sprintNews}</p>
              </div>
            ) : null}
            {sprintProNews ? (
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500 mb-1">Sprint Pro</p>
                <p className="text-zinc-200 whitespace-pre-wrap">{sprintProNews}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
