import { generateText as geminiText, generateTurn as geminiTurn, type InlineImage, type TurnResult } from "./gemini";

/* The one text call every writer, checker and planner makes. Callers say how
   hard the job is, not which model does it, so the model can change in one
   place: writing that a second pass checks anyway is "fast" and thinks less;
   the rest think fully. */

export type Tier = "fast" | "standard" | "deep";

export type TextOptions = {
  prompt: string;
  images?: InlineImage[];
  schema?: Record<string, unknown>;
  system?: string;
  thinking?: "default" | "low";
  /** How hard the job is. Absent: the caller's `thinking` decides. */
  tier?: Tier;
};

/** The thinking level a call gets, decided from the call alone. Pure. */
export function thinkingFor(options: Pick<TextOptions, "thinking" | "tier">): "default" | "low" {
  if (options.tier) return options.tier === "fast" ? "low" : "default";
  return options.thinking ?? "default";
}

export async function generateText<T = string>(options: TextOptions): Promise<T> {
  return geminiText<T>({ prompt: options.prompt, images: options.images, schema: options.schema, system: options.system, thinking: thinkingFor(options) });
}

/** One agent round with tools. */
export function generateTurn(options: Parameters<typeof geminiTurn>[0]): Promise<TurnResult> {
  return geminiTurn(options);
}
