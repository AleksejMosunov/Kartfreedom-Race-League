import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Championship } from "@/lib/models/Championship";
import { Pilot } from "@/lib/models/Pilot";
import { Team } from "@/lib/models/Team";
import { Stage } from "@/lib/models/Stage";
import {
  Stage as IStageType,
  Championship as IChampionshipType,
} from "@/types";
import { isValidNamePart, normalizeNamePart } from "@/lib/utils/pilotName";
import { requireCurrentChampionship } from "@/lib/championship/current";
import { isValidUkrPhone, normalizePhone } from "@/lib/utils/phone";
import { logAudit, sanitizeForAudit, getAuditIp, Change } from "@/lib/audit";

// Teams/endurance removed from registration flow; helper removed.

export async function POST(req: NextRequest) {
  await connectToDatabase();
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  // Helper: attach raceIds to registration entries when possible.
  async function attachRaceIdsToRegs(
    regs: Array<{
      championshipId?: unknown;
      stageId: string;
      firstRace?: boolean;
      secondRace?: boolean;
      racesCount?: number;
      raceIds?: unknown[];
    }>,
  ) {
    const toLoad: string[] = [];
    for (const r of regs) {
      if (!r.stageId) continue;
      // If raceIds already provided, skip
      if (Array.isArray(r.raceIds) && r.raceIds.length > 0) continue;
      toLoad.push(r.stageId);
    }
    if (toLoad.length === 0) return;
    const stages = await Stage.find({ _id: { $in: toLoad } })
      .select({ races: 1 })
      .lean();
    const stageMap: Record<string, any> = {};
    for (const s of stages) stageMap[String(s._id)] = s;

    for (const r of regs) {
      if (!r.stageId) continue;
      if (Array.isArray(r.raceIds) && r.raceIds.length > 0) continue;
      const s = stageMap[String(r.stageId)];
      if (!s || !Array.isArray(s.races)) continue;
      const ids: string[] = [];
      const useFirst = r.firstRace === undefined ? true : Boolean(r.firstRace);
      const useSecond =
        r.secondRace === undefined ? false : Boolean(r.secondRace);
      if (useFirst && s.races[0] && s.races[0]._id)
        ids.push(String(s.races[0]._id));
      if (useSecond && s.races[1] && s.races[1]._id)
        ids.push(String(s.races[1]._id));
      // Fallback: if neither selected but racesCount===2, include both available
      if (ids.length === 0 && r.racesCount === 2) {
        if (s.races[0] && s.races[0]._id) ids.push(String(s.races[0]._id));
        if (s.races[1] && s.races[1]._id) ids.push(String(s.races[1]._id));
      }
      r.raceIds = ids;
    }
  }

  // validate league if provided; default to 'newbie' on create
  if (body.league !== undefined) {
    if (body.league !== "pro" && body.league !== "newbie") {
      return NextResponse.json(
        { error: "Invalid league value" },
        { status: 400 },
      );
    }
  }

  let current;
  try {
    const championshipId =
      typeof body.championshipId === "string" ? body.championshipId : "";
    current = championshipId
      ? await Championship.findOne({
          _id: championshipId,
          status: "active",
        }).lean()
      : await requireCurrentChampionship();
  } catch {
    return NextResponse.json(
      { error: "Немає активного чемпіонату. Зверніться до адміністратора." },
      { status: 409 },
    );
  }

  if (!current) {
    return NextResponse.json(
      { error: "Обраний чемпіонат недоступний для реєстрації" },
      { status: 409 },
    );
  }

  // Teams/endurance removed — always handle individual pilot registration below.

  const name =
    typeof body.name === "string" ? normalizeNamePart(body.name) : "";
  const surname =
    typeof body.surname === "string" ? normalizeNamePart(body.surname) : "";
  // pilot number removed — ignore body.number
  const phone = normalizePhone(
    typeof body.phone === "string" ? body.phone : "",
  );
  // league handling differs by championship type
  // - for 'sprint-pro' championships league is optional and defaults to 'pro'
  // - for regular 'solo' sprint championships league must be provided (pro|newbie)
  const providedLeague =
    typeof body.league === "string" ? body.league : undefined;
  let leagueToSave: "pro" | "newbie" | undefined;
  if (current.championshipType === "sprint-pro") {
    // accept provided valid league, otherwise default to 'pro'
    if (
      providedLeague &&
      providedLeague !== "pro" &&
      providedLeague !== "newbie"
    ) {
      return NextResponse.json(
        { error: "Невірне значення ліги" },
        { status: 400 },
      );
    }
    leagueToSave = (providedLeague as "pro" | "newbie") ?? "pro";
  } else {
    // existing behavior: league MUST be provided for solo sprint championships
    if (!providedLeague) {
      return NextResponse.json(
        { error: "Вкажіть лігу пілота (pro або newbie)" },
        { status: 400 },
      );
    }
    if (providedLeague !== "pro" && providedLeague !== "newbie") {
      return NextResponse.json(
        { error: "Невірне значення ліги" },
        { status: 400 },
      );
    }
    leagueToSave = providedLeague as "pro" | "newbie";
  }

  if (!isValidUkrPhone(phone)) {
    return NextResponse.json(
      { error: "Вкажіть дійсний номер телефону у форматі +380XXXXXXXXX" },
      { status: 400 },
    );
  }

  const [duplicatePilot, duplicateTeam] = await Promise.all([
    Pilot.findOne({ championshipId: current._id, phone })
      .select({ _id: 1 })
      .lean(),
    Team.findOne({ championshipId: current._id, phone })
      .select({ _id: 1 })
      .lean(),
  ]);

  // If a team with same phone exists, keep existing behavior
  if (duplicateTeam) {
    return NextResponse.json(
      {
        error:
          "Учасник з таким телефоном вже зареєстрований у цьому чемпіонаті",
      },
      { status: 409 },
    );
  }

  if (!isValidNamePart(name) || !isValidNamePart(surname)) {
    return NextResponse.json(
      { error: "Name and surname are required and must contain only letters" },
      { status: 400 },
    );
  }

  // If championship has stages, require a valid stageId
  const rawStageId =
    typeof body.stageId === "string" ? body.stageId : undefined;
  const optingAllStages = rawStageId === "all";
  let providedStageId: string | undefined = undefined;

  if (optingAllStages) {
    // user chose to register to all stages — treat as no specific stage selected
    providedStageId = undefined;
  } else if (rawStageId) {
    // validate provided stage belongs to championship
    const stageExists = await Stage.findOne({
      _id: rawStageId,
      championshipId: current._id,
    })
      .select({ _id: 1 })
      .lean();
    if (!stageExists) {
      return NextResponse.json(
        { error: "Обраний етап недійсний для цього чемпіонату" },
        { status: 400 },
      );
    }
    providedStageId = rawStageId;
  } else {
    // no stage provided — require a stage only if the championship actually has stages
    const anyStage = await Stage.findOne({ championshipId: current._id })
      .select({ _id: 1 })
      .lean();
    if (anyStage) {
      return NextResponse.json(
        { error: "Оберіть етап для реєстрації" },
        { status: 400 },
      );
    }
  }

  const providedSwsId =
    typeof body.swsId === "string" && body.swsId.trim()
      ? body.swsId.trim()
      : undefined;

  // If client provided SWS ID, check for duplicates within the championship to provide a nicer error.
  if (providedSwsId) {
    const existingWithSws = await Pilot.findOne({
      championshipId: current._id,
      swsId: providedSwsId,
    })
      .select({ _id: 1 })
      .lean();
    if (existingWithSws) {
      return NextResponse.json(
        { error: "SWS ID вже використовується в цьому чемпіонаті" },
        { status: 409 },
      );
    }
  }

  // Accept new boolean fields `firstRace` and `secondRace`. Backwards compatible with `racesCount`.
  let firstRace = true;
  let secondRace = false;
  if (body.firstRace !== undefined || body.secondRace !== undefined) {
    firstRace = Boolean(body.firstRace);
    secondRace = Boolean(body.secondRace);
  } else if (body.racesCount !== undefined) {
    const rc = Number(body.racesCount);
    if (rc !== 1 && rc !== 2) {
      return NextResponse.json(
        { error: "Невірне значення участі у гонках" },
        { status: 400 },
      );
    }
    if (rc === 2) {
      firstRace = true;
      secondRace = true;
    } else {
      firstRace = true;
      secondRace = false;
    }
  }

  // Support client sending authoritative `registrations[]` instead of legacy top-level per-stage fields.
  let providedRegistrations:
    | Array<{
        championshipId?: string;
        stageId: string;
        firstRace?: boolean;
        secondRace?: boolean;
        racesCount?: number;
      }>
    | undefined = undefined;
  if (Array.isArray(body.registrations)) {
    // minimal validation; detailed validation happens later when merging
    providedRegistrations = (body.registrations as unknown[]).map((r) => {
      const rr = r as Record<string, unknown>;
      return {
        championshipId:
          typeof rr.championshipId === "string" ? rr.championshipId : undefined,
        stageId: String(rr.stageId ?? ""),
        firstRace:
          rr.firstRace === undefined ? undefined : Boolean(rr.firstRace),
        secondRace:
          rr.secondRace === undefined ? undefined : Boolean(rr.secondRace),
        racesCount:
          rr.racesCount === undefined ? undefined : Number(rr.racesCount),
      };
    });
  }

  try {
    // If a pilot with same phone exists anywhere, update it instead of creating duplicate
    const existingPilot = await Pilot.findOne({ phone });
    if (existingPilot) {
      // capture snapshot before modifications for accurate audit diff
      const before = sanitizeForAudit({
        name: existingPilot.name,
        surname: existingPilot.surname,
        league: existingPilot.league,
        championship: {
          id: String(current._id),
          name: (current as Partial<IChampionshipType>).name ?? "",
        },
        registrations: existingPilot.registrations,
      });
      // Build registrations map starting from existing registrations
      const regMap = new Map();
      if (Array.isArray(existingPilot.registrations)) {
        for (const r of existingPilot.registrations) {
          if (!r || !r.stageId) continue;
          const regChamp = r.championshipId ?? existingPilot.championshipId;
          const key = `${String(regChamp)}:${String(r.stageId)}`;
          regMap.set(key, {
            championshipId: regChamp,
            stageId: r.stageId,
            firstRace: Boolean(r.firstRace),
            secondRace: Boolean(r.secondRace),
            racesCount: r.racesCount ?? (r.firstRace && r.secondRace ? 2 : 1),
            raceIds: Array.isArray((r as any).raceIds)
              ? (r as any).raceIds
              : undefined,
          });
        }
      }

      // Migrate legacy registeredStageIds into registrations if present
      if (Array.isArray(existingPilot.registeredStageIds)) {
        for (const sid of existingPilot.registeredStageIds) {
          const champId = existingPilot.championshipId;
          const key = `${String(champId)}:${String(sid)}`;
          if (regMap.has(key)) continue;
          regMap.set(key, {
            championshipId: champId,
            stageId: sid,
            firstRace:
              Boolean(existingPilot.firstRace) ||
              existingPilot.racesCount === 2,
            secondRace:
              Boolean(existingPilot.secondRace) ||
              existingPilot.racesCount === 2,
            racesCount: existingPilot.racesCount ?? 1,
          });
        }
      }

      // Migrate legacy single `stageId` into registrations if present
      if (existingPilot.stageId) {
        const champId = existingPilot.championshipId;
        const key = `${String(champId)}:${String(existingPilot.stageId)}`;
        if (!regMap.has(key)) {
          regMap.set(key, {
            championshipId: champId,
            stageId: existingPilot.stageId,
            firstRace:
              Boolean(existingPilot.firstRace) ||
              existingPilot.racesCount === 2,
            secondRace:
              Boolean(existingPilot.secondRace) ||
              existingPilot.racesCount === 2,
            racesCount: existingPilot.racesCount ?? 1,
          });
        }
      }

      // Track which registration keys the client attempted to change, and whether any change actually occurs
      const touchedKeys: string[] = [];
      let anyRegChange = false;

      // Handle provided stage
      if (providedStageId === undefined) {
        // registering to all stages in this championship — clear per-stage registrations
        existingPilot.stageId = undefined;
        // remove any registrations for this championship (if present)
        existingPilot.registrations = (
          existingPilot.registrations || []
        ).filter((r: Record<string, unknown>) => {
          const rr = r as Record<string, unknown>;
          return (
            String(rr.championshipId ?? existingPilot.championshipId) !==
            String(current._id)
          );
        });
      } else {
        const key = `${String(current._id)}:${providedStageId}`;
        touchedKeys.push(key);
        if (regMap.has(key)) {
          const prev = regMap.get(key);
          const mergedFirst = prev.firstRace || firstRace;
          const mergedSecond = prev.secondRace || secondRace;
          // detect whether merging actually changes anything for this key
          if (
            Boolean(prev.firstRace) !== Boolean(mergedFirst) ||
            Boolean(prev.secondRace) !== Boolean(mergedSecond)
          ) {
            anyRegChange = true;
          }
          regMap.set(key, {
            championshipId: prev.championshipId ?? current._id,
            stageId: prev.stageId,
            firstRace: mergedFirst,
            secondRace: mergedSecond,
            racesCount: mergedFirst && mergedSecond ? 2 : 1,
          });
        } else {
          anyRegChange = true;
          regMap.set(key, {
            championshipId: current._id,
            stageId: providedStageId,
            firstRace,
            secondRace,
            racesCount: firstRace && secondRace ? 2 : 1,
          });
        }
      }

      // If client provided an explicit registrations[] payload, merge those as well
      if (providedRegistrations) {
        for (const r of providedRegistrations) {
          const champ = r.championshipId ?? String(current._id);
          if (!r.stageId) continue;
          const key = `${String(champ)}:${String(r.stageId)}`;
          const prFirst =
            r.firstRace === undefined ? true : Boolean(r.firstRace);
          const prSecond =
            r.secondRace === undefined ? false : Boolean(r.secondRace);
          touchedKeys.push(key);
          if (regMap.has(key)) {
            const prev = regMap.get(key);
            const mergedFirst = Boolean(prev.firstRace) || prFirst;
            const mergedSecond = Boolean(prev.secondRace) || prSecond;
            if (
              Boolean(prev.firstRace) !== Boolean(mergedFirst) ||
              Boolean(prev.secondRace) !== Boolean(mergedSecond)
            ) {
              anyRegChange = true;
            }
            regMap.set(key, {
              championshipId: prev.championshipId ?? champ,
              stageId: prev.stageId,
              firstRace: mergedFirst,
              secondRace: mergedSecond,
              racesCount: mergedFirst && mergedSecond ? 2 : 1,
              raceIds:
                (prev as any).raceIds && (prev as any).raceIds.length > 0
                  ? (prev as any).raceIds
                  : Array.isArray((r as any).raceIds)
                    ? (r as any).raceIds
                    : undefined,
            });
          } else {
            anyRegChange = true;
            regMap.set(key, {
              championshipId: champ,
              stageId: r.stageId,
              firstRace: prFirst,
              secondRace: prSecond,
              racesCount: r.racesCount ?? (prFirst && prSecond ? 2 : 1),
              raceIds: Array.isArray((r as any).raceIds)
                ? (r as any).raceIds
                : undefined,
            });
          }
        }
      }

      // If client attempted to register but no effective change was detected, inform the client
      if (touchedKeys.length > 0 && !anyRegChange) {
        return NextResponse.json(
          { error: "Ви вже зареєстровані на обрані гонки/етапи" },
          { status: 409 },
        );
      }

      const newRegs = Array.from(regMap.values()).map((r) => ({
        championshipId: r.championshipId,
        stageId: r.stageId,
        firstRace: r.firstRace,
        secondRace: r.secondRace,
        racesCount: r.racesCount,
      }));

      // Resolve raceIds for these registrations when possible
      await attachRaceIdsToRegs(newRegs as any);

      existingPilot.registrations = newRegs;

      if (!existingPilot.name && name) existingPilot.name = name;
      if (!existingPilot.surname && surname) existingPilot.surname = surname;
      if (!existingPilot.swsId && providedSwsId)
        existingPilot.swsId = providedSwsId;
      if (!existingPilot.league && leagueToSave)
        existingPilot.league = leagueToSave;

      const saved = await existingPilot.save();

      let changes: Change[] = [];
      try {
        const afterSnapshot = sanitizeForAudit({
          name: saved.name,
          surname: saved.surname,
          league: saved.league,
          championship: {
            id: String(current._id),
            name: (current as Partial<IChampionshipType>).name ?? "",
          },
          registrations: saved.registrations,
        });

        // compute human-friendly change list between before and after
        changes = [];

        // name/surname/league changes
        if ((before.name as string) !== saved.name) {
          changes.push({
            type: "name_changed",
            message: `Оновлено ім'я: "${before.name ?? ""}" → "${saved.name}"`,
            data: { field: "name", before: before.name, after: saved.name },
          });
        }
        if ((before.surname as string) !== saved.surname) {
          changes.push({
            type: "surname_changed",
            message: `Оновлено прізвище: "${before.surname ?? ""}" → "${saved.surname}"`,
            data: {
              field: "surname",
              before: before.surname,
              after: saved.surname,
            },
          });
        }
        if ((before.league as string) !== saved.league) {
          changes.push({
            type: "league_changed",
            message: `Оновлено лігу: "${before.league ?? ""}" → "${saved.league}"`,
            data: {
              field: "league",
              before: before.league,
              after: saved.league,
            },
          });
        }

        type RegEntry = {
          championshipId?: unknown;
          stageId?: unknown;
          firstRace?: boolean;
          secondRace?: boolean;
          racesCount?: number;
        };

        const beforeRegs: Record<string, RegEntry> = {};
        for (const r of (before.registrations as RegEntry[]) || []) {
          const key = `${String(r.championshipId ?? current._id)}:${String(r.stageId)}`;
          beforeRegs[key] = r;
        }
        const afterRegs: Record<string, RegEntry> = {};
        for (const r of (saved.registrations || []) as RegEntry[]) {
          const key = `${String(r.championshipId ?? current._id)}:${String(r.stageId)}`;
          afterRegs[key] = r;
        }

        const allStageKeys = Array.from(
          new Set([...Object.keys(beforeRegs), ...Object.keys(afterRegs)]),
        );
        const stageIdsToLoad = allStageKeys.map((k) => k.split(":")[1]);
        const stagesInfo = (await Stage.find({ _id: { $in: stageIdsToLoad } })
          .select({ _id: 1, name: 1 })
          .lean()) as Array<{ _id: unknown; name?: string }>;
        const stageNameMap: Record<string, string> = {};
        for (const s of stagesInfo)
          stageNameMap[String(s._id)] = s.name ?? String(s._id);

        for (const key of allStageKeys) {
          const beforeR = beforeRegs[key];
          const afterR = afterRegs[key];
          const stageId = key.split(":")[1];
          const stageLabel = stageNameMap[stageId] ?? stageId;
          if (!beforeR && afterR) {
            const races =
              afterR.racesCount ??
              (afterR.firstRace && afterR.secondRace ? 2 : 1);
            changes.push({
              type: "registered_stage",
              message: `Додано реєстрацію: «${stageLabel}» (${races} гонок)`,
              data: { stageId, stageLabel, races },
            });
          } else if (beforeR && !afterR) {
            changes.push({
              type: "unregistered_stage",
              message: `Скасовано реєстрацію: «${stageLabel}»`,
              data: { stageId, stageLabel },
            });
          } else if (beforeR && afterR) {
            const beforeRaces =
              beforeR.racesCount ??
              (beforeR.firstRace && beforeR.secondRace ? 2 : 1);
            const afterRaces =
              afterR.racesCount ??
              (afterR.firstRace && afterR.secondRace ? 2 : 1);
            if (beforeRaces !== afterRaces) {
              changes.push({
                type: "registration_updated",
                message: `Оновлено реєстрацію: «${stageLabel}» ${beforeRaces} → ${afterRaces} гонок`,
                data: { stageId, stageLabel, beforeRaces, afterRaces },
              });
            }
          }
        }

        const after = { ...afterSnapshot, changes };

        await logAudit({
          session: null,
          action: "update",
          entityType: "pilot",
          entityId: String((saved as unknown as { _id: unknown })._id),
          entityLabel: `${saved.name} ${saved.surname}`,
          before,
          after,
          ip: getAuditIp(req),
        });
      } catch (err) {
        console.error("Failed to write pilot update audit:", err);
      }

      // Build a human-friendly message for the client based on registration-related changes
      const regChanges = (changes || []).filter(
        (c) =>
          c.type === "registered_stage" || c.type === "registration_updated",
      );
      const message =
        regChanges.length > 0
          ? regChanges.map((c) => c.message).join("; ")
          : "Реєстрацію оновлено";

      // Return pilot and message so client can display exact feedback
      const savedObj = (saved as any).toObject
        ? (saved as any).toObject()
        : saved;
      return NextResponse.json({ pilot: savedObj, message }, { status: 200 });
    }

    const createDoc: Record<string, unknown> = {
      name,
      surname,
      phone,
      avatar: typeof body.avatar === "string" ? body.avatar : undefined,
      league: leagueToSave,
      swsId: providedSwsId,
    };

    // If a specific stage was provided, include per-stage registration record with championship context.
    // Do NOT write top-level `stageId`, `racesCount`, `firstRace`, `secondRace` or `registeredStageIds` when using `registrations`.
    if (providedStageId) {
      createDoc.registrations = [
        {
          championshipId: current._id,
          stageId: providedStageId,
          firstRace,
          secondRace,
          racesCount: firstRace && secondRace ? 2 : 1,
        },
      ];
      // resolve raceIds for the single-stage registration
      await attachRaceIdsToRegs(createDoc.registrations as any);
    }

    // If client provided `registrations[]`, prefer that as the authoritative set for creation (must include stageId in entries).
    if (providedRegistrations) {
      const regs: Array<{
        championshipId?: string | unknown;
        stageId: string;
        firstRace: boolean;
        secondRace: boolean;
        racesCount: number;
      }> = [];
      for (const r of providedRegistrations) {
        if (!r.stageId) continue;
        const pr = r as {
          championshipId?: string;
          stageId: string;
          firstRace?: boolean;
          secondRace?: boolean;
          racesCount?: number;
        };
        const prFirst =
          pr.firstRace === undefined ? true : Boolean(pr.firstRace);
        const prSecond =
          pr.secondRace === undefined ? false : Boolean(pr.secondRace);
        regs.push({
          championshipId: pr.championshipId ? pr.championshipId : current._id,
          stageId: pr.stageId,
          firstRace: prFirst,
          secondRace: prSecond,
          racesCount:
            pr.racesCount === undefined
              ? prFirst && prSecond
                ? 2
                : 1
              : Number(pr.racesCount),
        });
      }
      if (regs.length > 0) {
        // resolve raceIds for provided registrations
        await attachRaceIdsToRegs(regs as any);
        createDoc.registrations = regs;
      }
    }

    const pilot = await Pilot.create(createDoc);

    // Log registration to audit (strip phone automatically)
    try {
      let stageInfo: { id: string; name?: string } | null = null;
      if (providedStageId) {
        const s = await Stage.findById(providedStageId)
          .select({ name: 1 })
          .lean();
        if (s)
          stageInfo = {
            id: providedStageId,
            name: (s as Partial<IStageType>).name,
          };
      }

      const afterSnapshot = sanitizeForAudit({
        name,
        surname,
        league: leagueToSave,
        championship: {
          id: String(current._id),
          name: (current as Partial<IChampionshipType>).name ?? "",
        },
        stage: stageInfo,
      });

      const changes = [
        {
          type: "created_pilot",
          message: `Створено пілота: «${name} ${surname}»`,
          data: {
            championshipId: String(current._id),
            stage: stageInfo ?? null,
          },
        },
      ];

      await logAudit({
        session: null,
        action: "create",
        entityType: "pilot",
        entityId: String((pilot as unknown as { _id: unknown })._id),
        entityLabel: `${name} ${surname}`,
        before: null,
        after: { ...afterSnapshot, changes },
        ip: getAuditIp(req),
      });
    } catch (err) {
      console.error("Failed to write pilot registration audit:", err);
    }

    const pilotObj = (pilot as any).toObject
      ? (pilot as any).toObject()
      : pilot;
    return NextResponse.json(
      { pilot: pilotObj, message: "Реєстрацію успішно завершено" },
      { status: 201 },
    );
  } catch (err: unknown) {
    console.error("pilot-registration error:", err);
    if (
      typeof err === "object" &&
      err !== null &&
      "name" in err &&
      (err as { name: string }).name === "ValidationError"
    ) {
      return NextResponse.json(
        { error: "Name and surname must contain only letters" },
        { status: 400 },
      );
    }

    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: number }).code === 11000
    ) {
      return NextResponse.json(
        { error: `Duplicate entry or unique constraint violation` },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Failed to register pilot" },
      { status: 500 },
    );
  }
}
