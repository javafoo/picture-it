import Link from "next/link";
import type { ReactNode } from "react";

import { creditsFor, FREE_CREDITS } from "@/billing/pricing";
import { Logo } from "@/components/logo";
import { buttonClass } from "@/components/ui";

/* The signed-out homepage, laid out like a lookbook. One promise, shown
   working: your clothes on a model, with no photoshoot. Every picture on it was
   made by the app for Linen & Lane, a made-up shop, and the page says so. */

const LOOK_CREDITS = creditsFor({ kind: "tryon", withPhoto: true });

const STEPS = [
  { n: "01", title: "Add a piece", body: "One front-facing product photo. The one already in your shop works.", src: "/home/piece-dress.jpg", alt: "A product photo of a rust linen wrap dress." },
  { n: "02", title: "Pick where she wears it", body: "The street, a studio, golden hour. A new photo of your model is made in each place.", src: "/home/before-dress-street.jpg", alt: "Your model on a city street in a plain tee and jeans." },
  { n: "03", title: "Get the looks", body: "The try-on puts your exact piece on her. About a minute a look, ready for your feed and your ads.", src: "/home/look-dress-street.jpg", alt: "The same model on the same street, now wearing the rust wrap dress." },
];

const RANGE = [
  { piece: "/home/piece-shirt.jpg", name: "Cream linen shirt", looks: ["/home/look-shirt-cafe.jpg", "/home/look-shirt-golden.jpg"] },
  { piece: "/home/piece-trench.jpg", name: "Camel trench coat", looks: ["/home/look-trench-street.jpg", "/home/look-trench-boardwalk.jpg"] },
];

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-2xs tracking-[0.22em] text-muted uppercase">{children}</p>;
}

function StartButton({ className = "" }: { className?: string }) {
  return (
    <Link href="/sign-up" className={buttonClass("primary", "lg", className)}>
      Start free
    </Link>
  );
}

function Photo({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" className={`object-cover ${className}`} />;
}

export function Landing() {
  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <header className="flex items-center justify-between border-b border-line px-gutter py-4 md:px-8">
        <span className="text-2xl"><Logo /></span>
        <nav className="flex items-center gap-2">
          <Link href="/sign-in" className={buttonClass("ghost", "sm")}>Sign in</Link>
          <Link href="/sign-up" className={buttonClass("primary", "sm")}>Start free</Link>
        </nav>
      </header>

      <main>
        {/* The promise, and the whole product in one picture: a flat product photo becoming looks. */}
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-gutter py-12 md:grid-cols-[1fr_1.15fr] md:px-8 md:py-20">
          <div>
            <Eyebrow>For small clothing shops</Eyebrow>
            <h1 className="mt-4 font-display text-5xl leading-[1.02] tracking-tight text-balance md:text-7xl">
              Your clothes. On a model. <em className="italic">No photoshoot.</em>
            </h1>
            <p className="mt-6 max-w-md text-lg text-pretty text-ink-soft">
              Add a product photo. Your model wears the exact piece on the street, in a studio, at golden hour. Photos, lookbook posts and short videos for your feed and your ads.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <StartButton />
              <p className="text-sm text-muted">{FREE_CREDITS} free credits. A look is {LOOK_CREDITS}.</p>
            </div>
          </div>
          <div className="relative grid grid-cols-[0.8fr_1fr_1fr] items-end gap-3">
            <figure>
              <Photo src="/home/piece-dress.jpg" alt="The product photo: a rust linen wrap dress." className="aspect-[3/4] w-full bg-surface ring-1 ring-line" />
              <figcaption className="mt-2 text-2xs tracking-[0.14em] text-muted uppercase">The piece</figcaption>
            </figure>
            <figure>
              <Photo src="/home/look-dress-golden.jpg" alt="The model wearing the dress on a quiet street at golden hour." className="aspect-[4/5] w-full" />
              <figcaption className="mt-2 text-2xs tracking-[0.14em] text-muted uppercase">Golden hour</figcaption>
            </figure>
            <figure className="-mt-10">
              <Photo src="/home/look-dress-street.jpg" alt="The model wearing the dress on a city street." className="aspect-[4/5] w-full" />
              <figcaption className="mt-2 text-2xs tracking-[0.14em] text-muted uppercase">Street</figcaption>
            </figure>
          </div>
        </section>

        <section className="border-t border-line">
          <div className="mx-auto max-w-6xl px-gutter py-14 md:px-8 md:py-20">
            <h2 className="font-display text-4xl tracking-tight md:text-5xl">How it works</h2>
            <ol className="mt-10 grid gap-8 md:grid-cols-3">
              {STEPS.map((step) => (
                <li key={step.n}>
                  <Photo src={step.src} alt={step.alt} className="aspect-[4/5] w-full bg-surface" />
                  <p className="mt-4 text-2xs tracking-[0.22em] text-muted">{step.n}</p>
                  <h3 className="mt-1 font-display text-2xl">{step.title}</h3>
                  <p className="mt-2 text-sm text-ink-soft">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Why try-on and not plain image generation: the one thing a seller cannot give up. */}
        <section className="bg-ink text-canvas">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-gutter py-14 md:grid-cols-2 md:px-8 md:py-20">
            <div className="grid grid-cols-2 gap-3">
              <figure>
                <Photo src="/home/before-dress-street.jpg" alt="Before: the model in a plain tee and jeans." className="aspect-[4/5] w-full" />
                <figcaption className="mt-2 text-2xs tracking-[0.14em] text-canvas/70 uppercase">Before</figcaption>
              </figure>
              <figure>
                <Photo src="/home/look-dress-street.jpg" alt="After: the same photo, wearing the rust wrap dress." className="aspect-[4/5] w-full" />
                <figcaption className="mt-2 text-2xs tracking-[0.14em] text-canvas/70 uppercase">After</figcaption>
              </figure>
            </div>
            <div>
              <h2 className="font-display text-4xl tracking-tight md:text-5xl">The piece stays the piece.</h2>
              <p className="mt-5 max-w-md text-base text-canvas/80">
                Ask an image generator for your dress and it invents one that looks close. A customer who orders that dress gets a different one.
              </p>
              <p className="mt-3 max-w-md text-base text-canvas/80">
                Picture It uses the YouCam clothes try-on, which takes your real product photo and puts that garment on your model. The colour, the cut and the tie at the waist come from your photo.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-line">
          <div className="mx-auto max-w-6xl px-gutter py-14 md:px-8 md:py-20">
            <h2 className="font-display text-4xl tracking-tight md:text-5xl">One piece, a week of posts.</h2>
            <p className="mt-3 max-w-xl text-ink-soft">Tick your favourite looks and get a lookbook carousel with its caption, in your shop&apos;s voice. Press once more and a look starts moving, ready for Reels.</p>
            <div className="mt-10 grid items-start gap-6 md:grid-cols-[1fr_0.42fr]">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[0, 1, 2, 3].map((slide) => (
                  <Photo key={slide} src={`/home/slide-${slide}.jpg`} alt={`Slide ${slide + 1} of a lookbook post for the rust wrap dress.`} className="aspect-[4/5] w-full" />
                ))}
              </div>
              <video src="/home/look.mp4" poster="/home/look.jpg" autoPlay muted loop playsInline aria-label="A short video of the model turning to show how the dress moves." className="mx-auto aspect-[9/16] w-full max-w-[260px] bg-ink object-cover" />
            </div>
          </div>
        </section>

        <section className="border-t border-line">
          <div className="mx-auto max-w-6xl px-gutter py-14 md:px-8 md:py-20">
            <h2 className="font-display text-4xl tracking-tight md:text-5xl">Tops, dresses, jackets, coats.</h2>
            <div className="mt-10 grid gap-10 md:grid-cols-2">
              {RANGE.map((row) => (
                <div key={row.name}>
                  <div className="grid grid-cols-3 items-end gap-3">
                    <Photo src={row.piece} alt={`The product photo of the ${row.name.toLowerCase()}.`} className="aspect-[3/4] w-full bg-surface ring-1 ring-line" />
                    {row.looks.map((look) => <Photo key={look} src={look} alt={`The model wearing the ${row.name.toLowerCase()}.`} className="aspect-[4/5] w-full" />)}
                  </div>
                  <p className="mt-3 text-sm text-ink-soft">{row.name}</p>
                </div>
              ))}
            </div>
            <p className="mt-10 max-w-xl text-ink-soft">Your model can be you, from a few of your own photos, or a character from photos you have the right to use. She looks the same in every shot.</p>
          </div>
        </section>

        <section className="border-t border-line">
          <div className="mx-auto max-w-3xl px-gutter py-16 text-center md:py-24">
            <h2 className="font-display text-4xl tracking-tight text-balance md:text-6xl">Your next drop, <em className="italic">pictured.</em></h2>
            <p className="mx-auto mt-4 max-w-md text-ink-soft">{FREE_CREDITS} free credits when you sign up. A look is {LOOK_CREDITS} credits, and a look that fails costs nothing.</p>
            <StartButton className="mt-8" />
          </div>
        </section>
      </main>

      <footer className="border-t border-line px-gutter py-8 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-center text-xs text-muted md:flex-row md:text-left">
          <span className="text-lg text-ink"><Logo /></span>
          <p>Every picture here was made by the app for Linen &amp; Lane, a made-up shop, with an AI model. Clothes try-on by the YouCam API.</p>
        </div>
      </footer>
    </div>
  );
}
