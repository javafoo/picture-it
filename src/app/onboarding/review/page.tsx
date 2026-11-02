import { ActionForm } from "@/components/action-form";
import { Ask } from "@/components/onboarding/progress";
import { SetupScreen } from "@/components/onboarding/screen";
import { Card, Field, Input, Note, Textarea } from "@/components/ui";
import { compile } from "@/onboarding/compile";
import type { AnswerValue } from "@/onboarding/state";
import { step } from "@/onboarding/steps";

import { finishSetupAction, reviseAnswersAction } from "../actions";
import { openStage } from "../guard";

export const dynamic = "force-dynamic";

/* The last screen: everything she said, written out as the brief the rest of
   the app will read, with the boxes that produced each line underneath it.

   Editing here edits the answer, not a copy of it. A brief you can edit
   separately from the answers it came from is two versions of the truth, and
   within a week they disagree. */

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-line py-3 first:border-t-0 first:pt-0">
      <p className="eyebrow text-muted">{label}</p>
      <p className="mt-1 text-sm text-pretty text-ink-soft">{children}</p>
    </div>
  );
}

export default async function ReviewPage() {
  const { session } = await openStage("review");
  const interview = session!.interview;

  let compiled: ReturnType<typeof compile> | null = null;
  let problem = "";
  try {
    compiled = compile(interview);
  } catch (error) {
    problem = error instanceof Error ? error.message : String(error);
  }

  const answers = interview.answers;
  const offer = answers.offer as AnswerValue<"offer"> | undefined;
  const voice = answers.voice as AnswerValue<"voice"> | undefined;

  return (
    <SetupScreen stage="review">
      <Ask help="Your captions are written from this. Change anything that is not right.">
        Here is what we heard
      </Ask>

      {problem && <Note tone="warn" className="mb-5">{problem}</Note>}

      {compiled && (
        <Card className="mb-6 p-5 sm:p-6">
          <Line label="Who buys from you">{compiled.profile.audience}</Line>
          <Line label="What you sell">{compiled.profile.offer}</Line>
          <Line label="They comment">{compiled.profile.keyword}</Line>
          <Line label="How you sound">{compiled.profile.voice}</Line>
        </Card>
      )}

      <details className="mb-6 rounded-xl border border-line bg-surface">
        <summary className="flex min-h-12 items-center px-5 text-sm font-medium text-ink">Change an answer</summary>
        <div className="border-t border-line px-5 py-5">
          <ActionForm
            action={reviseAnswersAction}
            submitLabel="Save changes"
            pendingLabel="Saving…"
            className="space-y-6"
          >
            <input type="hidden" name="audience.present" value="1" />
            <Field label={step("audience").title} hint={step("audience").question}>
              <Textarea name="audience.text" rows={3} defaultValue={answers.audience?.text ?? ""} />
            </Field>

            <input type="hidden" name="offer.present" value="1" />
            <Field label={step("offer").title} hint="What it is, and the one word they comment.">
              <Textarea name="offer.text" rows={3} defaultValue={offer?.text ?? ""} />
            </Field>
            <Field label="Comment keyword">
              <Input name="offer.keyword" defaultValue={offer?.keyword ?? ""} className="uppercase" />
            </Field>

            <input type="hidden" name="voice.present" value="1" />
            <input type="hidden" name="voice.label" value={voice?.label ?? ""} />
            <input type="hidden" name="voice.is" value={(voice?.is ?? []).join("\n")} />
            <input type="hidden" name="voice.isNot" value={(voice?.isNot ?? []).join("\n")} />
            <Field label={`How you sound: ${voice?.label ?? ""}`} hint="The caption that sets the tone for everything else.">
              <Textarea name="voice.caption" rows={6} defaultValue={voice?.caption ?? ""} />
            </Field>
          </ActionForm>
        </div>
      </details>

      <ActionForm
        action={finishSetupAction}
        submitLabel="That is her. Finish"
        pendingLabel="Setting her up…"
        size="lg"
        hint="This saves everything and opens the Studio. Nothing here has cost you any credits."
        actionsClassName="flex flex-col gap-2 [&>button]:w-full"
      />
    </SetupScreen>
  );
}
