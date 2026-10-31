# Picture It

**Your clothes, on a model, ready to post. No photoshoot.**

Small clothing shops need photos of every piece being worn, on every channel, every week. A shoot costs more than most drops earn, and an image generator invents a dress that only looks like yours. Picture It takes your real product photo and puts that garment on your model with the [YouCam API](https://yce.perfectcorp.com/ai-api), then turns the looks into posts.

## What it does

1. **Add a piece.** One front-facing product photo.
2. **Pick where she wears it.** Up to three places. A new photo of your model is made in each one, standing the way the try-on needs.
3. **Get the looks.** YouCam dresses her in your exact piece, keeping her face, her pose and the place. Tap a look to see its before.
4. **Post them.** Tick looks to get a lookbook carousel with a caption in your shop's voice, or animate a look into a five-second vertical video.

## How YouCam is used

The AI Clothes Virtual Try-On V4 API (`/s2s/v2.0/task/cloth-v4`) does the dressing, in `src/ai/youcam.ts`:

- Each picture is uploaded through `/s2s/v2.0/file` to a pre-signed URL and named by its file id.
- A task is started with the model photo, the garment photo and the garment category.
- The task is polled until it succeeds, and the result is stored in the seller's private library.
- YouCam's error codes (`error_pose`, `error_invalid_ref` and others) become plain sentences that tell the seller what to change, and a failed look refunds its credits.

The try-on runs as a job (`src/jobs/`), reserved before it starts and refunded on failure. Each look in a shoot is its own job, so one failure never costs the others. The flow around it is in `src/tryon/looks.ts`, `src/app/studio/` and `src/components/studio/`.

## Other services

- **Gemini**: the new photos of the model, the writing, and the short videos.
- **Tavily**: this week's search results for the weekly post agent.
- **Next.js on Vercel, Clerk, Neon Postgres, private Vercel Blob.**

## Run it

```bash
pnpm install
cp .env.example .env.local   # fill in the keys
pnpm db:migrate
pnpm dev
```

Checks: `pnpm exec tsc --noEmit`, `pnpm exec eslint src scripts --max-warnings 0`, `pnpm test`.

The repository ships a plain photo style. A deployment can supply its own in the `HOUSE_STYLE` environment variable.

## Background

Picture It is built on my own earlier content app. The try-on job, the Studio, the lookbook posts, the new design and the homepage were built for the YouCam API hackathon.

License: AGPL-3.0.
