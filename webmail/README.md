# Cloud Mind Social Mail — webmail

Webmail client for **Cloud Mind Social** (`cloudmindsocial.com`), deployed at
`webmail.cloudmindsocial.com` as the Cloudflare Worker `webmail-cloudmind`.
Talks to the `Coastal-Carolina-Tech/email-server` JSON API at
`api.cloudmindsocial.com` — the `cloudmind` environment in that repo's
`wrangler.jsonc`.

Ported from the `Coastal-Carolina-Tech/webmail` client (the same app serves
rmyllc.com, coastalcarolinatech.com and fastcampaignhub.com) and restyled to
the Cloud Mind Social palette: paper ground, navy ink, sage and amber accents,
mirroring `../www/src/app/globals.css` so the inbox and the public site read as
one brand.

Next.js, deployed to Cloudflare Workers via OpenNext.

## Why this is its own build

One Worker serves exactly one webmail origin. `ORG_DOMAIN` on the API side
drives the CORS origin, the CSRF check and the session cookie domain, so the
API trusts `https://webmail.cloudmindsocial.com` and nothing else.

More sharply: **`NEXT_PUBLIC_API_BASE_URL` is inlined by Next at build time.**
No Worker var, secret or binding can change it afterwards, so a build is
permanently bound to one tenant's API. There is one build per tenant; a single
build promoted onto several Workers is not possible.

`npm run test:tenant` checks that wiring — the API base in `.env.production`
*and* the fallback in `src/lib/api.ts`, the Worker name against
`WORKER_SELF_REFERENCE`, the custom domain, and that `workers_dev` and
`preview_urls` are both off. Each of those fails silently if it is wrong, which
is why they are checked rather than trusted.

## Develop

After a fresh clone, generate the Cloudflare env types (`cloudflare-env.d.ts`
is gitignored, and `tsconfig.json` references it):

```bash
npm install
npm run cf-typegen
npm run dev
```

## Checks

```bash
npm run lint
npm run test:tenant   # per-tenant wiring
npm run test:zoned    # calendar timezone arithmetic
npm run build
```

## Deploy

```bash
npm run deploy
```

The Worker and its custom domain do not exist yet. Standing this up is §8 of
`docs/cloudmindsocial-deploy.md` in `Coastal-Carolina-Tech/email-server`, and
it depends on the `cloudmind` API environment being deployed first — until
`api.cloudmindsocial.com` resolves, this app has nothing to talk to.
