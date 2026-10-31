"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { buttonClass } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import { CAST_SHOTS, MIN_DESCRIPTION } from "@/tryon/cast";

/* For a seller with no photos: describe a model and her photos are made here.
   The portrait comes first, because every other shot is drawn from its face;
   the rest then run together. A shot that fails leaves the others in place. */

type Reply = { ok?: boolean; id?: string; message?: string } | null;

export function CastModel() {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [done, setDone] = useState<number | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  async function shot(index: number, first?: string): Promise<Reply> {
    const response = await fetch("/onboarding/cast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description, index, first }),
    });
    const reply = (await response.json().catch(() => null)) as Reply;
    setDone((count) => (reply?.ok ? (count ?? 0) + 1 : count));
    return reply;
  }

  async function cast() {
    setProblem(null);
    setDone(0);
    try {
      const portrait = await shot(0);
      if (!portrait?.ok || !portrait.id) {
        setProblem(portrait?.message ?? "Her photo could not be made. Try again.");
        return;
      }
      router.refresh();
      const rest = await Promise.all(CAST_SHOTS.slice(1).map((_, index) => shot(index + 1, portrait.id)));
      const failed = rest.find((reply) => !reply?.ok);
      if (failed) setProblem(failed.message ?? "One of her photos could not be made. You can upload one instead, or start again.");
      router.refresh();
    } finally {
      setDone(null);
    }
  }

  const working = done !== null;
  return (
    <div className="mb-6 border border-line bg-surface p-4">
      <p className="font-display text-xl text-ink">No photos? Describe her.</p>
      <Field label="What does your model look like?" hint="Her age, hair and style. She must be an adult and made up, not anyone real." className="mt-3">
        <Textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={2} maxLength={400} placeholder="Early thirties, warm brown skin, shoulder-length dark curls, small gold hoops, relaxed and friendly" />
      </Field>
      <button type="button" disabled={working || description.trim().length < MIN_DESCRIPTION} onClick={cast} className={buttonClass("quiet", "md", "mt-3 w-full")}>
        {working ? `Making her photos… ${done} of ${CAST_SHOTS.length}` : `Make ${CAST_SHOTS.length} photos of her · free`}
      </button>
      <p className="mt-2 text-xs text-muted">Takes about a minute. If she is not right, remove the photos and try other words.</p>
      {problem && <p role="alert" className="mt-2 text-sm text-danger">{problem}</p>}
    </div>
  );
}
