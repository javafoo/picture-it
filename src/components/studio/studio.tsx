"use client";

import { useRouter } from "next/navigation";
import { useActionState, useRef, useState } from "react";

import { animateAction, type ActionState } from "@/app/actions";
import { createCarouselAction } from "@/app/carousels/actions";
import { startLooksAction, type StudioState } from "@/app/studio/actions";
import { GARMENT_CATEGORIES, GARMENT_LABEL, type GarmentCategory } from "@/ai/youcam";
import { downscale } from "@/components/library/upload-client";
import { JobStatus } from "@/components/job-status";
import { buttonClass, creditWord } from "@/components/ui/button";
import type { StudioShelves } from "@/data/looks";
import { MAX_LOOKS_PER_SHOOT, SCENES, SCENE_KEYS, type SceneKey } from "@/tryon/looks";

/* The Studio: pick a piece, pick where she wears it, get the looks.

   One form. The piece and the places are the choices; the price is on the
   button before it is pressed, and it is the sum of the looks it starts. Each
   look is watched on its own, so the first one shows as soon as it lands. */

const src = (id: string) => `/api/media/${id}`;

export function Studio({ shelves, credits }: { shelves: StudioShelves; credits: { scene: number; photo: number; clip: number } }) {
  const router = useRouter();
  const [piece, setPiece] = useState<string | null>(shelves.pieces[0]?.id ?? null);
  const chosen = shelves.pieces.find((item) => item.id === piece);
  const [category, setCategory] = useState<GarmentCategory>((chosen?.category as GarmentCategory) ?? "auto");
  const [scenes, setScenes] = useState<SceneKey[]>(["street", "studio", "golden"]);
  const [model, setModel] = useState<string | null>(null);
  const [state, action, pending] = useActionState<StudioState, FormData>(startLooksAction, null);
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());

  const looks = model ? 1 : scenes.length;
  const total = model ? credits.photo : scenes.length * credits.scene;

  function pick(id: string) {
    setPiece(id);
    const next = shelves.pieces.find((item) => item.id === id);
    if (next) setCategory(next.category as GarmentCategory);
  }

  function toggleScene(key: SceneKey) {
    setModel(null);
    setScenes((current) => (current.includes(key) ? current.filter((item) => item !== key) : current.length >= MAX_LOOKS_PER_SHOOT ? current : [...current, key]));
  }

  return (
    <div className="grid gap-12">
      <form
        action={(form) => {
          form.set("requestId", requestId);
          action(form);
          setRequestId(crypto.randomUUID());
        }}
        className="grid gap-10 lg:grid-cols-[1.1fr_1fr]"
      >
        <input type="hidden" name="piece" value={piece ?? ""} />
        <input type="hidden" name="category" value={category} />
        {model ? <input type="hidden" name="model" value={model} /> : scenes.map((key) => <input key={key} type="hidden" name="scene" value={key} />)}

        <section>
          <StepTitle n={1} title="The piece" detail="A front-facing product photo, one garment, on a plain background." />
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
            <AddPiece onAdded={(id) => { router.refresh(); setPiece(id); }} category={category} />
            {shelves.pieces.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => pick(item.id)}
                aria-pressed={piece === item.id}
                className={`group relative aspect-[3/4] overflow-hidden bg-sunken text-left ring-1 transition ${piece === item.id ? "ring-2 ring-ink" : "ring-line hover:ring-line-strong"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src(item.id)} alt={item.name} className="size-full object-contain p-2" />
                <span className="absolute inset-x-0 bottom-0 truncate bg-surface/90 px-2 py-1 text-2xs tracking-wide text-ink uppercase">{item.name}</span>
              </button>
            ))}
          </div>

          <label className="mt-5 block">
            <span className="text-2xs tracking-[0.14em] text-muted uppercase">What it is</span>
            <select value={category} onChange={(event) => setCategory(event.target.value as GarmentCategory)} className="mt-1.5 block w-full border border-line bg-surface px-3 py-2.5 text-sm text-ink">
              {GARMENT_CATEGORIES.map((key) => <option key={key} value={key}>{GARMENT_LABEL[key]}</option>)}
            </select>
            {category === "lower_body" && <span className="mt-1.5 block text-xs text-muted">Bottoms work best from a photo of someone wearing them, not a flat shot.</span>}
          </label>
        </section>

        <section>
          <StepTitle n={2} title="Where she wears it" detail={`Up to ${MAX_LOOKS_PER_SHOOT} places. A new photo of your model is made in each, then the piece is tried on her.`} />
          <div className="mt-4 flex flex-wrap gap-2">
            {SCENE_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleScene(key)}
                aria-pressed={!model && scenes.includes(key)}
                className={`min-h-11 border px-4 text-sm tracking-wide transition ${!model && scenes.includes(key) ? "border-ink bg-ink text-canvas" : "border-line bg-surface text-ink hover:border-line-strong"}`}
              >
                {SCENES[key].label}
              </button>
            ))}
          </div>

          {shelves.models.length > 0 && (
            <details className="mt-6">
              <summary className="cursor-pointer text-sm text-ink-soft underline-offset-4 hover:underline">Or use a photo of her you already have</summary>
              <p className="mt-2 text-xs text-muted">She needs to be standing, facing the camera. {creditWord(credits.photo)}.</p>
              <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
                {shelves.models.map((id) => (
                  <button key={id} type="button" onClick={() => setModel(model === id ? null : id)} aria-pressed={model === id} className={`aspect-[4/5] overflow-hidden ring-1 ${model === id ? "ring-2 ring-ink" : "ring-line"}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src(id)} alt="A photo of your model" className="size-full object-cover" />
                  </button>
                ))}
              </div>
            </details>
          )}

          <div className="mt-8 border-t border-line pt-6">
            <button type="submit" disabled={pending || !piece || looks === 0} className={buttonClass("spend", "lg", "w-full")}>
              {pending ? "Starting…" : `Picture it · ${looks} look${looks === 1 ? "" : "s"} · ${creditWord(total)}`}
            </button>
            <p className="mt-2 text-xs text-muted">
              {model ? "One look on the photo you picked." : `Each look is a new photo of your model (${creditWord(credits.scene - credits.photo)}) and a try-on (${creditWord(credits.photo)}).`} A look that fails is not charged.
            </p>
            {state && !state.ok && <p role="alert" className="mt-3 text-sm text-danger">{state.message}</p>}
          </div>
        </section>
      </form>

      {state?.ok && state.jobIds?.length ? (
        <section aria-live="polite">
          <p className="text-sm text-ink-soft">{state.message}</p>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {state.jobIds.map((jobId) => (
              <JobStatus key={jobId} jobId={jobId} workingLabel="Dressing her…" pollMs={3000}>
                {(job) => (job.status === "completed" && job.mediaIds[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src(job.mediaIds[0])} alt="The new look" className="aspect-[4/5] w-full object-cover" />
                ) : null)}
              </JobStatus>
            ))}
          </div>
        </section>
      ) : null}

      <Looks looks={shelves.looks} pieces={shelves.pieces} clipCredits={credits.clip} />
    </div>
  );
}

function StepTitle({ n, title, detail }: { n: number; title: string; detail: string }) {
  return (
    <div>
      <p className="text-2xs tracking-[0.18em] text-muted uppercase">Step {n}</p>
      <h2 className="mt-1 font-display text-2xl text-ink">{title}</h2>
      <p className="mt-1 text-sm text-ink-soft">{detail}</p>
    </div>
  );
}

function AddPiece({ onAdded, category }: { onAdded: (id: string) => void; category: GarmentCategory }) {
  const input = useRef<HTMLInputElement>(null);
  const [rights, setRights] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  async function send(file: File) {
    setBusy(true);
    setProblem(null);
    try {
      const { body, type, name } = await downscale(file);
      const form = new FormData();
      form.set("file", new File([body], name, { type }));
      form.set("rights", "yes");
      form.set("category", category);
      form.set("name", file.name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ").slice(0, 60));
      const response = await fetch("/studio/upload", { method: "POST", body: form });
      const reply = (await response.json().catch(() => null)) as { ok?: boolean; id?: string; message?: string } | null;
      if (!reply?.ok || !reply.id) setProblem(reply?.message ?? "That photo could not be added.");
      else onAdded(reply.id);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="flex aspect-[3/4] flex-col items-center justify-center gap-2 border border-dashed border-line-strong bg-surface p-2 text-center">
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => event.target.files?.[0] && send(event.target.files[0])} />
      <button type="button" disabled={!rights || busy} onClick={() => input.current?.click()} className="text-sm text-ink underline-offset-4 enabled:hover:underline disabled:text-muted">
        {busy ? "Adding…" : "+ Add a piece"}
      </button>
      <label className="flex items-start gap-1.5 text-left text-2xs leading-tight text-muted">
        <input type="checkbox" checked={rights} onChange={(event) => setRights(event.target.checked)} className="mt-0.5" />
        I sell this, or have the right to use the photo.
      </label>
      {problem && <span role="alert" className="text-2xs text-danger">{problem}</span>}
    </div>
  );
}

function Looks({ looks, pieces, clipCredits }: { looks: StudioShelves["looks"]; pieces: StudioShelves["pieces"]; clipCredits: number }) {
  const [before, setBefore] = useState<string | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [lookbook, makeLookbook, making] = useActionState<ActionState, FormData>(createCarouselAction, null);
  const [lookbookId] = useState(() => crypto.randomUUID());
  if (!looks.length) return null;
  const first = looks.find((look) => look.id === picked[0]);
  const piece = first ? pieces.find((item) => item.id === first.garmentMediaId) : undefined;

  function toggle(id: string) {
    setPicked((current) => (current.includes(id) ? current.filter((item) => item !== id) : current.length >= 4 ? current : [...current, id]));
  }

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-3">
        <h2 className="font-display text-3xl text-ink">Your looks</h2>
        <p className="text-xs text-muted">Tap a look to see the before. Tick two to four to make a lookbook post.</p>
      </div>

      {picked.length >= 2 && (
        <form action={makeLookbook} className="sticky top-2 z-10 mt-4 flex flex-wrap items-center justify-between gap-3 border border-ink bg-surface px-4 py-3">
          <input type="hidden" name="requestId" value={lookbookId} />
          <input type="hidden" name="topic" value={`New in: ${piece?.name ?? "the new piece"}. ${picked.length} ways to wear it.`} />
          <input type="hidden" name="format" value="carousel" />
          <input type="hidden" name="layout" value="photos" />
          <input type="hidden" name="skeleton" value="lookbook" />
          <input type="hidden" name="kit" value="serif" />
          {[...picked, ...(piece ? [piece.id] : [])].map((id) => <input key={id} type="hidden" name="photos" value={id} />)}
          <span className="text-sm text-ink">{picked.length} looks picked</span>
          <button type="submit" disabled={making} className={buttonClass("primary", "md")}>{making ? "Starting…" : "Make a lookbook post · free"}</button>
          {lookbook && !lookbook.ok && <p role="alert" className="w-full text-sm text-danger">{lookbook.message}</p>}
        </form>
      )}

      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {looks.map((look) => {
          const item = pieces.find((candidate) => candidate.id === look.garmentMediaId);
          const showBefore = before === look.id && look.modelMediaId;
          return (
            <figure key={look.id}>
              <div className="relative">
                <button type="button" onClick={() => setBefore(before === look.id ? null : look.id)} className="relative block w-full overflow-hidden bg-sunken" aria-label={showBefore ? "Show the look" : "Show the before"}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src(showBefore ? look.modelMediaId! : look.id)} alt={showBefore ? "Before: your model" : `${item?.name ?? "The piece"}, on your model`} className="aspect-[4/5] w-full object-cover" />
                  <span className="absolute top-2 left-2 bg-surface/90 px-2 py-0.5 text-2xs tracking-[0.14em] text-ink uppercase">{showBefore ? "Before" : "After"}</span>
                  {item && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src(item.id)} alt="" className="absolute right-2 bottom-2 size-14 bg-surface object-contain p-1 shadow ring-1 ring-line" />
                  )}
                </button>
                <label className="absolute top-2 right-2 flex size-8 cursor-pointer items-center justify-center bg-surface/90" title="Pick for a lookbook post">
                  <input type="checkbox" checked={picked.includes(look.id)} onChange={() => toggle(look.id)} aria-label="Pick for a lookbook post" />
                </label>
              </div>
              <figcaption className="mt-2 flex items-center justify-between gap-2">
                <span className="truncate text-sm text-ink">{item?.name ?? "Look"}</span>
                <a href={`/api/media/${look.id}?download=1`} className="shrink-0 text-xs text-ink-soft underline-offset-4 hover:underline">Download</a>
              </figcaption>
              <Animate lookId={look.id} credits={clipCredits} />
            </figure>
          );
        })}
      </div>
    </section>
  );
}

/* A look, moving: a five-second vertical clip for Reels and ads, made from the
   look with the video model the rest of the app uses. */
const MOTION = "She turns slowly to one side and back to show how the outfit moves and falls, then smiles at the camera. The camera stays still.";

function Animate({ lookId, credits }: { lookId: string; credits: number }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(animateAction, null);
  const [requestId] = useState(() => crypto.randomUUID());
  if (state?.ok && state.jobId) {
    return (
      <JobStatus jobId={state.jobId} workingLabel="Making the video… two to four minutes." pollMs={4000} refreshOnFinish={false} className="mt-2">
        {(job) => (job.status === "completed" && job.mediaIds[0] ? (
          <video src={src(job.mediaIds[0])} controls playsInline loop className="mt-2 aspect-[9/16] w-full bg-ink object-cover" />
        ) : null)}
      </JobStatus>
    );
  }
  return (
    <form action={action} className="mt-1">
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="image" value={lookId} />
      <input type="hidden" name="motion" value={MOTION} />
      <input type="hidden" name="model" value="omni" />
      <input type="hidden" name="aspectRatio" value="9:16" />
      <button type="submit" disabled={pending} className="text-xs text-ink-soft underline-offset-4 hover:underline disabled:text-muted">
        {pending ? "Starting…" : `Animate for Reels · ${creditWord(credits)}`}
      </button>
      {state && !state.ok && <p role="alert" className="mt-1 text-xs text-danger">{state.message}</p>}
    </form>
  );
}
