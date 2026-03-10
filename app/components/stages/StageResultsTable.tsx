import { Stage } from "@/types";
import { Badge } from "@/app/components/ui/Badge";

interface StageResultsTableProps {
  stage: Stage;
}

const positionMedals: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export function StageResultsTable({ stage }: StageResultsTableProps) {
  const sorted = [...stage.results].sort((a, b) => a.position - b.position);

  if (!sorted.length) {
    return <p className="text-zinc-500 text-center py-8">Результаты ещё не добавлены.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-zinc-900 text-zinc-400 text-left">
            <th className="px-4 py-3 font-semibold w-16">Место</th>
            <th className="px-4 py-3 font-semibold">Пилот</th>
            <th className="px-4 py-3 font-semibold text-center">Статус</th>
            <th className="px-4 py-3 font-semibold text-center">Очки</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((result, idx) => {
            // pilotId may be a populated pilot object or a raw id string
            const pilotObj =
              result.pilot ??
              (result.pilotId !== null &&
                typeof result.pilotId === "object" &&
                "name" in (result.pilotId as object)
                ? (result.pilotId as typeof result.pilot)
                : null);
            const pilotIdStr =
              pilotObj && "_id" in (pilotObj as object)
                ? String((pilotObj as { _id: unknown; })._id)
                : String(result.pilotId);
            return (
              <tr
                key={pilotIdStr || idx}
                className="border-t border-zinc-800 hover:bg-zinc-800/40 transition-colors"
              >
                <td className="px-4 py-3 font-bold text-zinc-300">
                  {positionMedals[result.position] ?? result.position}
                </td>
                <td className="px-4 py-3">
                  {pilotObj ? (
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 text-xs font-mono w-6">
                        #{pilotObj.number}
                      </span>
                      <span className="font-semibold text-white">{pilotObj.name}</span>
                    </div>
                  ) : (
                    <span className="text-zinc-500">{pilotIdStr}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {result.dnf ? (
                    <Badge variant="warning">DNF</Badge>
                  ) : result.dns ? (
                    <Badge variant="danger">DNS</Badge>
                  ) : (
                    <Badge variant="success">FIN</Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-center font-bold text-white">
                  {result.points}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
