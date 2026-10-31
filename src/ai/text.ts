import { ContentBlockedError, generateText as geminiText, generateTurn as geminiTurn, type InlineImage, type TurnResult } from "./gemini";

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

/* One more try after a short wait. A writer's call failed once in testing
   and then answered on the second try with the same prompt, and a failed call
   fails the whole job it belongs to. A refusal is an answer, not a fault, so
   it is never retried. */
const RETRY_AFTER_MS = 2000;

export async function generateText<T = string>(options: TextOptions): Promise<T> {
  const call = () => geminiText<T>({ prompt: options.prompt, images: options.images, schema: options.schema, system: options.system, thinking: thinkingFor(options) });
  try {
    return await call();
  } catch (error) {
    if (error instanceof ContentBlockedError) throw error;
    console.warn(`[text] retrying once: ${error instanceof Error ? error.message.slice(0, 200) : String(error)}`);
    await new Promise((resolve) => setTimeout(resolve, RETRY_AFTER_MS));
    return call();
  }
}

/** One agent round with tools. */
export function generateTurn(options: Parameters<typeof geminiTurn>[0]): Promise<TurnResult> {
  return geminiTurn(options);
}
