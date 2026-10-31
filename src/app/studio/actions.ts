"use server";

import { revalidatePath } from "next/cache";

import { garmentCategory } from "@/ai/youcam";
import { identityLock } from "@/data/avatars";
import { getMedia } from "@/data/media";
import { pieceOf } from "@/data/looks";
import type { User } from "@/data/users";
import { startJob } from "@/jobs";
import { guardedAction } from "@/lib/action-guard";
import { currentAvatar } from "@/lib/current-avatar";
import { InvalidRequestError } from "@/lib/errors";
import { MAX_LOOKS_PER_SHOOT, sceneKey, type SceneKey } from "@/tryon/looks";

export type StudioState = { ok: boolean; message: string; jobIds?: string[] } | null;

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

/**
 * Picture it: one piece, on her, in up to three places, or on a photo of her
 * she picked. Each look is its own job with its own price, so one that fails
 * refunds alone and the others still land.
 */
export async function startLooksAction(_: StudioState, form: FormData): Promise<StudioState> {
  return guardedAction<{ message: string; jobIds: string[] }, StudioState>(form, {
    where: "startLooksAction",
    run: (user, requestId) => startLooks(user, requestId, form),
    done: (outcome) => ({ ok: true, ...outcome }),
    failed: (message) => ({ ok: false, message }),
  });
}

async function startLooks(user: User, requestId: string, form: FormData) {
  const avatar = await currentAvatar(user.id);
  if (!avatar || !identityLock(avatar)) throw new InvalidRequestError("Finish setting up your model first.");

  const piece = await getMedia(user.id, text(form, "piece"));
  if (!piece || piece.kind !== "image" || !pieceOf(piece)) throw new InvalidRequestError("Pick a piece, or add one.");
  const category = garmentCategory(text(form, "category") || pieceOf(piece)?.category);

  const modelMediaId = text(form, "model");
  if (modelMediaId) {
    const model = await getMedia(user.id, modelMediaId);
    if (!model || model.kind !== "image" || (model.avatarId && model.avatarId !== avatar.id)) throw new InvalidRequestError("That photo of her is not in your library.");
  }
  const scenes = [...new Set(form.getAll("scene").map(sceneKey).filter((key): key is SceneKey => key !== null))].slice(0, MAX_LOOKS_PER_SHOOT);
  if (!modelMediaId && !scenes.length) throw new InvalidRequestError("Pick at least one place to shoot.");

  const looks = modelMediaId ? [{ key: "photo", input: { modelMediaId } }] : scenes.map((scene) => ({ key: scene, input: { scene } }));
  const jobIds: string[] = [];
  for (const look of looks) {
    // One submission, several jobs: each keeps its own idempotency key under the form's.
    const job = await startJob(user, {
      kind: "tryon",
      avatarId: avatar.id,
      requestId: `${requestId}:${look.key}`,
      input: { kind: "tryon", garmentMediaId: piece.id, category, ...look.input },
    });
    jobIds.push(job.id);
  }
  revalidatePath("/studio");
  const count = jobIds.length;
  return {
    message: count === 1 ? "Making your look. About a minute." : `Making ${count} looks. About a minute each, all at once.`,
    jobIds,
  };
}
