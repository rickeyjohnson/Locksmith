export type GuardDecision =
  | { action: "pass"; text?: string }
  | { action: "block"; reason: string };

export interface GuardContext {
  password: string;
  userPrompt: string;
}

export interface Guard {
  name: string;
  stage: "input" | "output";
  run(text: string, ctx: GuardContext): Promise<GuardDecision>;
}
