# Picture It

Product content for small clothing sellers, without a photoshoot.
Upload a product photo; it is tried on an AI model of your choosing with the YouCam API, and the app writes and makes the posts around it.

Work in progress. Full setup instructions to follow.

## Run locally

```bash
pnpm install
cp .env.example .env.local   # fill in the keys
pnpm dev
```

Checks: `pnpm exec tsc --noEmit`, `pnpm exec eslint src scripts --max-warnings 0`, `pnpm test`.

License: AGPL-3.0.
