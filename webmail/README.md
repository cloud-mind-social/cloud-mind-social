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

**Deploy webmail (cloudmindsocial.com)** in GitHub Actions is the path:
Actions -> that workflow -> Run workflow. It runs the gate below and then
`npm run deploy`, which creates `webmail-cloudmind` and attaches the custom
domain from `wrangler.jsonc`. Once it is on `main`, a change under `webmail/`
deploys itself.

It needs the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repo secrets
(Workers Scripts:Edit and Zone:Read). Push them from the suite console's
credential vault rather than pasting them in — that pair is adoptable from the
platform for exactly this purpose, and pushing keeps one copy so a rotation
reaches this repo with the rest of the estate.

The same thing by hand, which still works:

```bash
npm run test:tenant   # do not skip; see below
npm run deploy
```

`test:tenant` is not ceremony. `NEXT_PUBLIC_API_BASE_URL` is inlined at build
time and cannot be corrected afterwards; an inherited `WORKER_SELF_REFERENCE`
puts this app's cache calls in another tenant's Worker; and a shared Worker name
reassigns custom domains, which is how `webmail.coastalcarolinatech.com` was
dropped once already. All three fail silently at runtime.

**The API side is live.** `Coastal-Carolina-Tech/email-server` provisioned the
`cloudmind` environment on 2026-09-17: `api.cloudmindsocial.com` resolves and
`/health` returns `{"ok":true}`, and the zone's Email Routing catch-all points
at `email-server-cloudmind`.

Two things to know before testing against it:

- **Signing in needs a setup link.** The provisioning workflow seeds the org and
  the owner mailbox, and has run green since; `hello@cloudmindsocial.com` exists
  and mail delivers to it. But it is created `invited` with no password, and CI
  deliberately never prints the link. Mint one from `email-server` and hand it
  over directly — it is a credential:

  ```bash
  npm run seed:tenant -- --tenant cloudmind --link
  ```

- **Outbound mail still fails.** `cloudmindsocial.com` is not onboarded to
  Cloudflare Email **Sending** (dashboard-only, no API), so sends fail
  `E_RECIPIENT_NOT_ALLOWED`. `cf-bounce.cloudmindsocial.com` having no record is
  the tell. This does not block the deploy, and it is also why the public site's
  branded acknowledgement is not going out.

Full sequence: `docs/adding-a-tenant.md` and §8 of
`docs/cloudmindsocial-deploy.md` in `Coastal-Carolina-Tech/email-server`.
