import Link from "next/link";

import { spendableBalance } from "@/billing/credits";
import { creditsFor } from "@/billing/pricing";
import { formatCredits } from "@/billing/gate";
import { Studio } from "@/components/studio/studio";
import { buttonClass, EmptyState, PageHeader } from "@/components/ui";
import { identityLock } from "@/data/avatars";
import { studioShelves } from "@/data/looks";
import { requireUser } from "@/data/users";
import { currentAvatar } from "@/lib/current-avatar";

export const dynamic = "force-dynamic";

/* Each look runs after the response that started it: a photo of the model and
   a try-on, a minute or two in all, inside this route's time limit. */
export const maxDuration = 300;

const CREDITS = { scene: creditsFor({ kind: "tryon", withPhoto: true }), photo: creditsFor({ kind: "tryon", withPhoto: false }) };

/* The Studio: the product. A piece from her shop, on her model, in the places
   she picks. No photoshoot. */
export default async function StudioPage() {
  const user = await requireUser();
  const avatar = await currentAvatar(user.id);
  const ready = Boolean(avatar && identityLock(avatar));

  if (!avatar || !ready) {
    return (
      <>
        <PageHeader eyebrow="Studio" title="Picture it on her" />
        <EmptyState title="Set up your model first" action={<Link href="/onboarding" className={buttonClass("primary")}>Set up your model</Link>}>
          Your pieces are tried on your model, so she needs to exist first. It takes a few minutes.
        </EmptyState>
      </>
    );
  }

  const [shelves, balance] = await Promise.all([studioShelves(user.id, avatar.id), spendableBalance(user.id)]);
  return (
    <>
      <PageHeader
        eyebrow="Studio"
        title="Picture it on her"
        lead={`Add a piece from your shop. ${avatar.name} wears it wherever you pick, in photos ready for your feed and your ads. You have ${formatCredits(balance)}.`}
      />
      <Studio shelves={shelves} credits={CREDITS} />
    </>
  );
}
