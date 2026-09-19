export interface AttemptRecord {
  id: string;
  playerId: string;
  levelId: number;
  attemptNo: number;
  prompt: string;
  rawModelResponse: string | null;
  shownResponse: string;
  status: "ok" | "blocked" | "error";
  blockedBy: string | null;
  guardTrace: unknown;
  leaked: boolean;
  rawLeaked: boolean;
  latencyMs: number;
  model: string;
  configHash: string;
  createdAt: string;
}

export interface GuessRecord {
  id: string;
  playerId: string;
  levelId: number;
  guess: string;
  correct: boolean;
  attemptsBefore: number;
  createdAt: string;
}

export interface Store {
  saveAttempt(a: AttemptRecord): Promise<void>;
  saveGuess(g: GuessRecord): Promise<void>;
  countAttempts(playerId: string, levelId: number): Promise<number>;
  solvedLevels(playerId: string): Promise<number[]>;
}
