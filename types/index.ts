export interface Pilot {
  _id: string;
  name: string;
  number: number;
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
}

export interface ChampionshipStanding {
  pilot: Pilot;
  totalPoints: number;
  bestPoints: number;
  stagesCount: number;
  standings: PilotStanding[];
  position: number;
}

export type PointsMap = Record<number, number>;
