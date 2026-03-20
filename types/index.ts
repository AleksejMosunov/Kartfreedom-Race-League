export interface Pilot {
  _id: string;
  name: string;
  surname: string;
  league?: "pro" | "newbie";
  number: number;
  phone?: string;
  swsId?: string;
  stageId?: string;
  racesCount?: number;
  firstRace?: boolean;
  secondRace?: boolean;
  registeredStageIds?: string[];
  registrations?: {
    championshipId?: string;
    stageId: string;
    firstRace: boolean;
    secondRace: boolean;
    racesCount: number;
  }[];
  championshipId?: string;
  teamIsSolo?: boolean;
  teamDrivers?: TeamDriver[];
  completedStagesCount?: number;
  avatar?: string;
  createdAt?: string;
}

export interface TeamDriver {
  name: string;
  surname: string;
}

export interface StageResult {
  pilotId: string;
  pilot?: Pilot;
  position: number;
  points: number;
  dnf: boolean;
  dns: boolean;
  bestLap?: boolean;
  penaltyPoints?: number;
  penaltyReason?: string;
}

export interface Stage {
  _id: string;
  name: string;
  number: number;
  date: string;
  isCompleted: boolean;
  results: StageResult[];
  createdAt?: string;
}

export interface PilotStanding {
  stageId: string;
  stageName: string;
  stageNumber: number;
  points: number;
  position: number | null;
  isDropped: boolean;
  dnf: boolean;
  dns: boolean;
  penaltyPoints: number;
  penaltyReason: string;
}

export interface ChampionshipStanding {
  pilot: Pilot;
  totalPoints: number;
  bestPoints: number;
  stagesCount: number;
  standings: PilotStanding[];
  position: number;
  positionDelta?: number;
}

export interface RegulationSection {
  title: string;
  content: string;
}

export interface RegulationsContent {
  title: string;
  intro: string;
  sections: RegulationSection[];
}

export interface ChampionshipPrize {
  place: string;
  description: string;
}

export interface Championship {
  _id: string;
  name: string;
  status: "active" | "archived";
  championshipType: "sprint" | "sprint-pro";
  // 'sprint-pro' — sprint championship where pilots register without choosing a league (treated as pro)
  // 'solo' remains the existing sprint with both leagues selectable
  fastestLapBonusEnabled?: boolean;
  startedAt: string;
  endedAt?: string;
  regulations?: RegulationsContent;
  prizes?: ChampionshipPrize[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Team {
  _id: string;
  championshipId: string;
  name: string;
  number: number;
  phone?: string;
  isSolo?: boolean;
  drivers?: TeamDriver[];
  createdAt?: string;
  updatedAt?: string;
}

export type PointsMap = Record<number, number>;
