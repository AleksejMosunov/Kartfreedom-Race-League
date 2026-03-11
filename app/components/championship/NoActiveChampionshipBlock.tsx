interface NoActiveChampionshipBlockProps {
  news?: string;
}

export function NoActiveChampionshipBlock({ news }: NoActiveChampionshipBlockProps) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center">
        <h2 className="text-2xl font-black text-white mb-2">Немає активного чемпіонату</h2>
        <p className="text-zinc-400">
          Публічні розділи будуть доступні після старту нового чемпіонату.
        </p>
        {news ? (
          <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-left">
            <p className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Новини</p>
            <p className="text-zinc-200 whitespace-pre-wrap">{news}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
