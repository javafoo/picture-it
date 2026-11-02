import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

import { dismissSetupNoteAction } from "@/app/actions";
import { buttonClass, Card, MediaTile, PageHeader, Section, StepIndicator } from "@/components/ui";
import { ArrowIcon } from "@/components/ui/icons";
import { referenceCount } from "@/data/avatars";
import { getProfile, profileComplete } from "@/data/brand";
import { listMedia, mediaUrl } from "@/data/media";
import { requireUser } from "@/data/users";
import { Landing } from "@/components/home/landing";
import { canSwitchAvatars, currentAvatar } from "@/lib/current-avatar";
import { setupComplete, setupSteps } from "@/lib/setup";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { isAuthenticated } = await auth();
  if (!isAuthenticated) return <Landing />;
  return <Overview />;
}

async function Overview() {
  const user = await requireUser();
  const avatar = await currentAvatar(user.id);
  const [profile, references, images, switchable] = await Promise.all([
    getProfile(user.id, avatar?.id ?? null),
    avatar ? referenceCount(user.id, avatar.id) : 0,
    listMedia(user.id, "image", { avatarId: avatar?.id, orUnassigned: true }),
    canSwitchAvatars(user),
  ]);

  const steps = setupSteps({
    profileComplete: profileComplete(profile),
    keyword: profile.keyword,
    references,
  });
  const complete = setupComplete(steps);

  // The newest photo the judge kept, for the card below. Rejected takes are hidden.
  const portrait = images.find((image) => (image.meta as { keep?: boolean }).keep !== false);
  const next = steps.find((step) => !step.done);
  const doneCount = steps.filter((step) => step.done).length;
  const name = profile.personaName?.trim() || avatar?.name?.trim() || "Your model";

  return (
    <>
      <PageHeader
        eyebrow={complete ? "Set up" : `${doneCount} of ${steps.length} steps done`}
        title={next ? "Here is your next step" : `${name} is ready to post`}
      >
      </PageHeader>

      {/* Which avatar every page is about, and the way to the others. It lives
          here rather than in the phone's top bar, which has no room for it;
          the desktop rail keeps its own. Only for a plan with more than one. */}
      {switchable && avatar && (
        <p className="-mt-4 mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft">
          <span>
            Working on <span className="font-semibold text-ink">{avatar.name}</span>
          </span>
          <Link href="/avatars" className="inline-flex min-h-11 items-center font-medium text-accent underline-offset-4 hover:underline">
            Switch model
          </Link>
        </p>
      )}

      {/* Her own imagery, not an illustration: the most recent photo in the
          library, which this page has already loaded. */}
      <Card className="mb-10 p-6 sm:p-8">
        <div className="flex gap-5 sm:gap-8">
          <div className="min-w-0 flex-1">
            <p className="eyebrow text-accent">{next ? `Step ${steps.indexOf(next) + 1} · ${next.title}` : "Today"}</p>
            <h2 className="mt-2 max-w-md font-display text-2xl text-balance sm:text-3xl">
              {next ? next.todo : `Dress ${name} in your next piece`}
            </h2>
            <p className="mt-3 max-w-md text-sm text-muted">
              {next ? next.body : "Add a product photo. She wears it in the places you pick, in photos and videos ready for your feed and your ads."}
            </p>
          </div>
          {portrait && (
            <MediaTile
              kind="image"
              src={mediaUrl(portrait.id)}
              alt={`The newest photo of ${name}`}
              ratio="3:4"
              className="w-24 shrink-0 self-start sm:w-40"
            />
          )}
        </div>
        <Link href={next ? next.href : "/studio"} className={buttonClass("primary", "lg", "mt-6 w-full sm:w-auto")}>
          {next ? `Open ${next.title}` : "Open the Studio"}
          <ArrowIcon className="size-4" />
        </Link>
      </Card>

      {/* The step list has done its job once every step is done. It is replaced
          by one note, shown until she has read it, and then by nothing: the
          numbers and dots leave the menu at the same moment. */}
      {!complete && (
        <Section title="Setup">
          <StepIndicator items={steps} />
        </Section>
      )}
      {complete && !user.setupSeenAt && (
        <Card className="border-good/40 bg-good-soft p-6 sm:p-8" aria-labelledby="setup-done">
          <p className="eyebrow text-good">Setup done</p>
          <h2 id="setup-done" className="mt-2 font-display text-2xl text-ink sm:text-3xl">
            You are set up.
          </h2>
          <p className="mt-3 max-w-md text-sm text-ink-soft">
            From here it is the Studio: add a piece and pick where she wears it.
          </p>
          <form action={dismissSetupNoteAction} className="mt-5">
            <button type="submit" className={buttonClass("quiet")}>
              Got it
            </button>
          </form>
        </Card>
      )}
    </>
  );
}
