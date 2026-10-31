import { generateImage, type InlineImage } from "@/ai/gemini";
import { getAvatar } from "@/data/avatars";
import { deleteMedia, MediaLimitReachedError, readMedia, saveMediaCapped } from "@/data/media";
import { flowStateFor } from "@/data/onboarding";
import { requireUser, type User } from "@/data/users";
import { EmailNotVerifiedError } from "@/lib/email-gate";
import { userMessage } from "@/lib/errors";
import { reencodeToJpeg } from "@/lib/image-reencode";
import { RateLimitedError } from "@/lib/rate-limit";
import { screenOnUpload } from "@/safety/gate";
import { SafetyRefusalError } from "@/safety/refusals";
import { screenSceneIdea } from "@/safety/screen";
import { withModelSpend } from "@/spend";
import { castDescription, castPrompt, CAST_SHOTS } from "@/tryon/cast";

import { MAX_PHOTOS } from "../photos";

/* One photo of a model she described, per request, the way uploads go up one
   per request: a dropped connection costs one photo. A photo takes twenty
   seconds or so, which is longer than a request should normally run, and it is
   here rather than in a job because setup's photos are already a request-sized
   step with their own progress on the page. Setup is free, so this is bounded
   by her generation allowance and the global daily cap, not by credits. */

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function fail(status: number, message: string): Response {
  return Response.json({ ok: false, message }, { status });
}

export async function POST(request: Request): Promise<Response> {
  const user = await requireUser();
  try {
    return await cast(request, user);
  } catch (error) {
    if (error instanceof RateLimitedError) return fail(429, error.message);
    if (error instanceof EmailNotVerifiedError) return fail(403, error.message);
    if (error instanceof SafetyRefusalError) return fail(422, error.message);
    if (error instanceof MediaLimitReachedError) return fail(409, `${MAX_PHOTOS} photos is the most we can use. Remove one first.`);
    return fail(500, userMessage("onboarding cast", error));
  }
}

async function cast(request: Request, user: User): Promise<Response> {
  const body = (await request.json().catch(() => null)) as { description?: unknown; index?: unknown; first?: unknown } | null;
  const description = castDescription(body?.description);
  if (!description) return fail(400, "Say a little more about her: her age, her hair, her style.");
  const index = Number(body?.index);
  if (!Number.isInteger(index) || index < 0 || index >= CAST_SHOTS.length) return fail(400, "That shot does not exist.");

  const { session, uploads } = await flowStateFor(user.id);
  const avatarId = session?.ui.avatarId ?? null;
  if (!session || !avatarId || !(await getAvatar(user.id, avatarId))) return fail(409, "Setup has not started yet. Go back to the first screen.");
  if (session.interview.setup.avatarKind !== "avatar") return fail(409, "This account uses your own face, so it needs your own photos.");
  if (!session.ui.consent) return fail(403, "Tick the box first.");

  const verdict = await withModelSpend(user, { limit: "vision", shape: "screen_idea" }, () => screenSceneIdea(description));
  if (!verdict.ok) return fail(422, "That description cannot be used. Describe an adult, and nobody real.");

  // The face for every later shot: the portrait this same run made, looked up as hers.
  const references: InlineImage[] = [];
  if (index > 0) {
    const first = uploads.find((photo) => photo.id === body?.first);
    if (!first) return fail(409, "The first photo is gone. Start again.");
    references.push({ mimeType: first.contentType, data: await readMedia(user.id, first.id) });
  }

  const image = await withModelSpend(user, { limit: "jobs", shape: "cast_photo" }, () =>
    generateImage({ prompt: castPrompt(description, index), references, aspectRatio: "4:5", label: `cast:${avatarId}` }));
  const photo = await reencodeToJpeg(image.data, { claimedType: image.mimeType });

  const media = await saveMediaCapped(
    user.id,
    {
      kind: "upload",
      avatarId,
      data: photo.data,
      contentType: photo.contentType,
      width: photo.width,
      height: photo.height,
      meta: { source: "cast", description, shot: index, consent: session.ui.consent.kind, consentAt: session.ui.consent.at },
    },
    MAX_PHOTOS,
  );
  const screened = await withModelSpend(user, { limit: "vision", shape: "screen_photo" }, () =>
    screenOnUpload(user.id, media.id, { mimeType: photo.contentType, data: photo.data }));
  if (!screened.ok) {
    await deleteMedia(user.id, media.id);
    return fail(422, screened.message);
  }
  return Response.json({ ok: true, id: media.id });
}
