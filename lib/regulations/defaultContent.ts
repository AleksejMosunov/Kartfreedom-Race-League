import { RegulationsContent } from "@/types";
import { POINTS_TABLE } from "@/lib/utils/championship";

function buildScoringContent(fastestLapBonusEnabled: boolean): string {
  const rows = Object.entries(POINTS_TABLE)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([pos, pts]) => `${pos} місце — ${pts} очк.`)
    .join("\n");
  const bestLapNote = fastestLapBonusEnabled
    ? " Пілот, що показав найшвидше коло етапу, отримує додатково +1 очко."
    : "";
  return `Бали нараховуються за фінішну позицію у фіналі:\n${rows}.${bestLapNote} У підсумковому заліку 2 найгірші результати кожного пілота не враховуються.`;
}

export function buildDefaultRegulations(
  fastestLapBonusEnabled = false,
): RegulationsContent {
  return {
    title: "Регламент чемпіонату",
    intro: "Основні правила участі, нарахування балів та поведінки на трасі.",
    sections: [
      {
        title: "1. Участь у чемпіонаті",
        content:
          "До участі допускаються пілоти, які пройшли реєстрацію та підтвердили присутність на етапі в установлені терміни.",
      },
      {
        title: "2. Формат етапу",
        content:
          "Кожен етап складається з кваліфікації та основного заїзду. Позиція на старті визначається результатами кваліфікації.",
      },
      {
        title: "3. Нарахування балів",
        content: buildScoringContent(fastestLapBonusEnabled),
      },
      {
        title: "4. Штрафи та дисципліна",
        content:
          "Контактна боротьба, агресивне блокування та умисні зіткнення можуть призвести до штрафу, анулювання результату етапу або дискваліфікації.",
      },
    ],
  };
}

// backward-compat static export used as Mongoose schema default
export const defaultRegulationsContent: RegulationsContent =
  buildDefaultRegulations(false);
