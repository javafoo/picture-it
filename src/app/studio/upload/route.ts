import { garmentCategory } from "@/ai/youcam";
import { requireUser } from "@/data/users";
import { currentAvatar } from "@/lib/current-avatar";
import { requireWithinLimit } from "@/lib/rate-limit";

import { MAX_BYTES, MIN_BYTES } from "../../onboarding/photos";
import { fail, RIGHTS_REQUIRED, rightsConfirmed, storeUpload, UPLOAD_LIMIT, uploadFailure } from "../../library/upload/store";

/* One product photo, in the body: a piece from her shop to be tried on.

   The same path as a library upload (re-encoded, screened, capped), marked as
   a piece so the Studio lists it and as a "scene" photo so nothing picks it
   as a photo of her. The browser has already shrunk it to a 2048px JPEG. */

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const user = await requireUser();
  try {
    await requireWithinLimit(user, UPLOAD_LIMIT);
    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) return fail(400, "No file was sent.");
    if (!rightsConfirmed(form?.get("rights"))) return fail(400, RIGHTS_REQUIRED);
    if (file.type.startsWith("video/")) return fail(400, "Add a photo of the piece, not a video.");
    if (file.size > MAX_BYTES) return fail(413, `That photo is bigger than ${MAX_BYTES / 1024 / 1024}MB.`);
    if (file.size < MIN_BYTES) return fail(400, "That file is too small to be a photo.");

    const avatar = await currentAvatar(user.id);
    if (!avatar) return fail(409, "Set up your model first, then add your pieces.");

    const name = String(form?.get("name") ?? "").trim().slice(0, 80) || file.name.replace(/\.[a-z0-9]+$/i, "").slice(0, 80) || "New piece";
    const piece = { name, category: garmentCategory(form?.get("category")) };
    const raw = Buffer.from(await file.arrayBuffer());
    return await storeUpload(
      { user, avatarId: avatar.id, folderId: null, originalName: file.name.slice(0, 120), rightsConfirmedAt: new Date().toISOString(), subject: "scene", piece },
      raw,
      file.type,
    );
  } catch (error) {
    return uploadFailure(error);
  }
}
