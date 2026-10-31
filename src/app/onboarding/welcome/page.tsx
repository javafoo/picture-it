import { ActionForm } from "@/components/action-form";
import { LanguageSelect } from "@/components/language-select";
import { ChoiceCard } from "@/components/onboarding/choice";
import { Ask } from "@/components/onboarding/progress";
import { SetupScreen } from "@/components/onboarding/screen";
import { Field, Input, Note } from "@/components/ui";

import { startSetupAction } from "../actions";
import { openStage } from "../guard";

export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  const { session } = await openStage("welcome");
  const setup = session?.interview.setup;

  return (
    <SetupScreen stage="welcome">
      <Ask help="About ten minutes, on your phone, and you can stop at any point and come back. Nothing here costs anything.">
        Let&rsquo;s set up your model
      </Ask>

      <ActionForm
        action={startSetupAction}
        submitLabel={setup ? "Save and carry on" : "Start"}
        pendingLabel="Saving…"
        size="lg"
        className="space-y-6"
        hint="You can change any of this later."
        actionsClassName="flex flex-col gap-2 pt-1 [&>button]:w-full"
      >
        <Field label="What is she called?" hint="Your model's name. Use your own if she is you.">
          <Input name="personaName" defaultValue={setup?.personaName ?? ""} placeholder="Ava" autoComplete="off" required />
        </Field>

        <Field label="What does your shop sell?" hint="One line. What you sell and who buys it.">
          <Input
            name="niche"
            defaultValue={setup?.niche ?? ""}
            placeholder="Easy linen dresses for women who want to feel good all week"
            autoComplete="off"
            required
          />
        </Field>

        <LanguageSelect defaultValue={setup?.language} />

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-ink">Who wears your clothes?</legend>
          <p className="text-xs text-muted">This decides what we can promise about the photos.</p>
          <div className="mt-2 space-y-3">
            <ChoiceCard
              name="avatarKind"
              value="twin"
              title="My own face"
              defaultChecked={setup?.avatarKind === "twin"}
            >
              You will upload photos of yourself, and the looks will be of you.
            </ChoiceCard>
            <ChoiceCard
              name="avatarKind"
              value="avatar"
              title="A made-up model"
              defaultChecked={setup?.avatarKind === "avatar" || !setup}
            >
              Describe her and we make her photos, or upload photos you have the right to use.
            </ChoiceCard>
          </div>
        </fieldset>

        <Note>Next: five to fifteen photos of her, made or uploaded. They stay private to your account.</Note>
      </ActionForm>
    </SetupScreen>
  );
}
