export interface Pilot {
  _id: string;
  name: string;
  surname: string;
  number: number;
  phone?: string;
  avatar?: string;
  createdAt?: string;
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

export interface Championship {
  _id: string;
  name: string;
  status: "active" | "archived";
  championshipType: "solo" | "teams";
  fastestLapBonusEnabled?: boolean;
  startedAt: string;
  endedAt?: string;
  regulations?: RegulationsContent;
  createdAt?: string;
  updatedAt?: string;
}

export interface Team {
  _id: string;
  championshipId: string;
  name: string;
  number: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BallastRule {
  position: number;
  kg: number;
}

export interface PilotBallastAdjustment {
  _id: string;
  pilotId: string;
  kg: number;
  reason: string;
  createdAt?: string;
}

export interface PilotAutoBallastEntry {
  stageId: string;
  stageName: string;
  stageNumber: number;
  position: number;
  kg: number;
}

export interface PilotBallastSummary {
  pilotId: string;
  autoKg: number;
  manualKg: number;
  totalKg: number;
  autoEntries: PilotAutoBallastEntry[];
  manualEntries: PilotBallastAdjustment[];
}

export type PointsMap = Record<number, number>;
