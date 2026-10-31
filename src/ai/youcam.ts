import { providerFailure } from "./provider-error";

/* Perfect Corp's YouCam API: AI Clothes virtual try-on, V4.

   It puts the garment from a product photo onto the person in another photo
   and keeps everything else: her face, her pose, the street behind her. The
   flow is the documented one (docs.perfectcorp.com/reference/ai_clothes):
   each picture is uploaded to a pre-signed URL and named by a file id, a task
   is started with both ids, and the task is asked about until it says
   `success` or `error`. The live test on 2026-10-30 answered in 13 seconds
   with an 896×1200 photo.

   Pure parts (request bodies, reading answers, the plain sentences) are
   exported for tests; the four calls below them are the only network. */

const BASE = process.env.YOUCAM_API_BASE ?? "https://yce-api-01.makeupar.com";

export const TRYON_TASK = "cloth-v4";

/** What the garment is, as the API names it. "auto" lets it decide. */
export const GARMENT_CATEGORIES = ["auto", "upper_body", "lower_body", "full_body", "outer", "shoes"] as const;
export type GarmentCategory = (typeof GARMENT_CATEGORIES)[number];

export const GARMENT_LABEL: Record<GarmentCategory, string> = {
  auto: "Let it decide",
  upper_body: "Top",
  lower_body: "Bottoms",
  full_body: "Dress or full outfit",
  outer: "Jacket or coat",
  shoes: "Shoes",
};

/** A form value as a category, or "auto" when it is not one. */
export function garmentCategory(value: unknown): GarmentCategory {
  return GARMENT_CATEGORIES.find((category) => category === value) ?? "auto";
}

/* Two units a try-on (the feature-cost endpoint, read 2026-10-30). The price
   of a unit is not published in a form we can read, so $0.05 is assumed and
   a try-on is held at $0.10; `src/billing/pricing.ts` carries the same figure. */
export const TRYON_UNITS = 2;
export const TRYON_USD = 0.1;

/** The body that starts a try-on. Pure. */
export function tryOnBody(input: { personFileId: string; garmentFileId: string; category: GarmentCategory }): Record<string, unknown> {
  return {
    src_file_id: input.personFileId,
    ref_file_id: input.garmentFileId,
    garment_category: input.category,
    // Shoes in a full-outfit photo are swapped only when the shoes are the point.
    change_shoes: input.category === "shoes",
    filter_multi_person: "off",
  };
}

export type TryOnState =
  | { state: "pending"; status: string }
  | { state: "completed"; url: string }
  | { state: "failed"; code: string };

/** What a status answer says. Anything that is neither done nor failed is still working. Pure. */
export function readTryOnStatus(json: unknown): TryOnState {
  const data = (json as { data?: { task_status?: unknown; error?: unknown; results?: { url?: unknown } } } | null)?.data;
  const status = typeof data?.task_status === "string" ? data.task_status : "unknown";
  if (status === "success") {
    const url = data?.results?.url;
    if (typeof url !== "string" || !url.startsWith("https://")) return { state: "failed", code: "no_result" };
    return { state: "completed", url };
  }
  if (status === "error") return { state: "failed", code: typeof data?.error === "string" ? data.error : "unknown_internal_error" };
  return { state: "pending", status };
}

/* The documented error codes, said so a seller can fix the photo. */
const PLAIN: Record<string, string> = {
  error_pose: "The model needs to stand facing the camera, with her body in view. Try another model photo.",
  error_invalid_src: "The model photo could not be used. Pick one where she stands facing the camera.",
  error_multi_person: "The model photo has more than one person in it. Pick one with just her.",
  error_invalid_ref: "The product photo could not be read as clothing. Use a front-facing photo of one piece.",
  error_apply_region_mismatch: "That piece does not match the type picked. Check the type and try again.",
  error_below_min_image_size: "One of the photos is too small. Use one at least 512 pixels wide.",
  exceed_max_filesize: "One of the photos is too large. Use one under 10MB.",
  error_nsfw_content_detected: "The try-on service refused one of the photos.",
};

/** The sentence for a failed try-on. Pure. */
export function plainTryOnError(code: string): string {
  return PLAIN[code] ?? "The try-on service could not finish this one. Nothing was charged.";
}

/* ---- Calls ---------------------------------------------------------------- */

function key(): string {
  const value = process.env.YOUCAM_API_KEY;
  if (!value) throw new Error("Missing YOUCAM_API_KEY");
  return value;
}

async function api(method: "GET" | "POST", path: string, body?: unknown): Promise<unknown> {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${key()}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(60_000),
  });
  const json = (await response.json().catch(() => null)) as { error?: unknown } | null;
  if (!response.ok) throw providerFailure("YouCam", TRYON_TASK, response.status, typeof json?.error === "string" ? json.error : "request failed");
  return json;
}

/** Upload one picture and return its file id. */
export async function uploadToYouCam(data: Buffer, contentType: string, fileName: string): Promise<string> {
  const json = (await api("POST", "/s2s/v2.0/file", { files: [{ content_type: contentType, file_name: fileName, file_size: data.byteLength }] })) as {
    data?: { files?: { file_id?: string; requests?: { method?: string; url?: string; headers?: Record<string, string> }[] }[] };
  };
  const file = json.data?.files?.[0];
  const put = file?.requests?.[0];
  if (!file?.file_id || !put?.url) throw new Error("YouCam upload: no file id in the answer");
  const response = await fetch(put.url, {
    method: put.method ?? "PUT",
    headers: put.headers ?? { "Content-Type": contentType },
    body: new Uint8Array(data),
    signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok) throw new Error(`YouCam upload failed: ${response.status}`);
  return file.file_id;
}

/** Start a try-on. Returns the task id. */
export async function startTryOn(input: { personFileId: string; garmentFileId: string; category: GarmentCategory }): Promise<string> {
  const json = (await api("POST", `/s2s/v2.0/task/${TRYON_TASK}`, tryOnBody(input))) as { data?: { task_id?: unknown } };
  const id = json.data?.task_id;
  if (typeof id !== "string" || !id) throw new Error("YouCam try-on: no task id in the answer");
  return id;
}

/** Ask once how a try-on is going. */
export async function tryOnStatus(taskId: string): Promise<TryOnState> {
  return readTryOnStatus(await api("GET", `/s2s/v2.0/task/${TRYON_TASK}/${encodeURIComponent(taskId)}`));
}

/** Download a finished try-on. The link is good for two hours. Its cost is the job's, settled with its outcome. */
export async function downloadTryOn(url: string): Promise<Buffer> {
  const response = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error(`YouCam result download failed: ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}
