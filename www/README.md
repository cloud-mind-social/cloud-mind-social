# Cloud Mind Social — website

The public site plus the inquiry inbox behind it. Next.js on Cloudflare
Workers (via OpenNext), with Cloudflare D1 for storage and Cloudflare Email
Sending for mail.

- `/` — the landing page and discovery-call form
- `/admin` — the inbox: read inquiries, reply, track status, keep private notes
- `/admin/login` — sign in
- `/admin/setup` — creates the first account, once

## How an inquiry flows

1. Someone fills in the form on `/`. It's validated on the server, rate
   limited, and written to D1.
2. Two emails go out immediately:
   - a **branded acknowledgement** to them — what they sent, what happens
     next, and the one-business-day promise the site makes;
   - a **notification** to `INQUIRY_NOTIFY_TO` with a link straight to the
     inquiry in the inbox.
3. It appears in `/admin` as **New**. Opening it moves it to **Looking at it**.
4. Replying from the inbox sends a branded email and moves it to **Replied**.
   `Reply-To` is set to `MAIL_REPLY_TO`, so their answer lands in the normal
   inbox and the conversation carries on by email as usual.

The record is written before any email is attempted, so a mail outage can
never lose an inquiry.

## First deploy

### 1. Create the databases

```bash
npx wrangler d1 create cloud-mind-social
npx wrangler d1 create cloud-mind-social-staging
```

Paste each returned id over the `REPLACE_WITH_*_D1_ID` placeholders in
`wrangler.jsonc`, then apply the schema:

```bash
npm run db:migrate            # production
npm run db:migrate:staging    # staging
```

### 2. Onboard the sending domain

Mail goes out through **Cloudflare Email Sending** using the `EMAIL` binding —
no API key, no third-party account. It's in beta and needs the Workers Paid
plan to reach arbitrary recipients.

In the dashboard: **Compute → Email Service → Email Sending → Onboard Domain**,
and pick the domain in `MAIL_FROM`. Cloudflare adds the MX, SPF, DKIM, and
DMARC records itself, all on a **`cf-bounce.` subdomain** — existing mail on
the root domain is untouched, so onboarding can't break an inbox that already
works.

Until a sending domain is onboarded, the binding will only deliver to
*verified destination addresses* in the account; anything else fails with
`E_RECIPIENT_NOT_ALLOWED`. The inbox surfaces that message as-is rather than
claiming a reply was sent.

### 3. Set the secrets

```bash
npx wrangler secret put ADMIN_SETUP_TOKEN   # any long random string
npx wrangler secret put IP_HASH_SALT        # any long random string
```

Add `--env staging` to each for the staging Worker.

The plain (non-secret) values — `SITE_URL`, `MAIL_FROM`, `MAIL_REPLY_TO`,
`INQUIRY_NOTIFY_TO` — live in `wrangler.jsonc` under `vars`.

`MAIL_REPLY_TO` and `INQUIRY_NOTIFY_TO` must be a mailbox that actually
**receives** mail — that's where customer replies and new-inquiry alerts land.
Check it has MX records before trusting it.

### 4. Deploy and create the account

```bash
npm run deploy
```

Visit `/admin/setup`, enter the `ADMIN_SETUP_TOKEN` along with a name, email,
and password. **That page stops working the moment an account exists** — it
redirects to sign-in from then on.

## Day-to-day

| Task | Command |
|---|---|
| Local dev | `npm run dev` |
| Deploy to staging | `npm run deploy:staging` |
| Deploy to production | `npm run deploy` |
| Apply a new migration | `npm run db:migrate` |
| Reset a password | `npm run admin:account -- reset <email>` |
| Add another account | `npm run admin:account -- create <email> "<Name>"` |

`admin:account` asks for the password on stdin and prints the SQL to run — it
never puts a password in shell history, and only the hash reaches the database.

## Local development

```bash
npm install
npm run db:migrate:local
npm run dev
```

Local secrets go in `.dev.vars` (gitignored):

```
ADMIN_SETUP_TOKEN=local-setup-token
IP_HASH_SALT=local-dev-salt
SITE_URL=http://localhost:3000
```

`next dev` has no `EMAIL` binding, so mail is printed to the console instead
of sent and the inbox says plainly that nothing was delivered rather than
pretending it was.

To exercise the real binding, run the built Worker — `wrangler dev` simulates
Email Sending, logging each message and writing its HTML and text parts to
`.wrangler/tmp/email/` so they can be opened in a browser:

```bash
npm run preview
```

To send *real* mail from a local run, add `"remote": true` to the `send_email`
binding in `wrangler.jsonc`.

## Notes

**Hosting plan.** Signing in derives a PBKDF2 hash, which costs roughly 45ms
of CPU. That fits the Workers **Paid** plan comfortably (30s default) but
exceeds the Free plan's 10ms per-request CPU limit. Everything else in the app
is well under it — only sign-in and account creation are affected. If staying
on Free is necessary, lower `ITERATIONS` in `src/lib/password.ts` and reset
the password; the iteration count is stored inside each hash, so existing
passwords keep working at the old cost until they're reset.

**Spam.** The form has a honeypot field and a per-sender rate limit of 5 an
hour. Sign-in is throttled separately: 8 failures per account and 20 per IP in
a 15-minute window. If the form starts attracting real spam, Cloudflare
Turnstile is the next step.

**Privacy.** IP addresses are salted and hashed before storage, never kept in
the clear.

**Email design.** `src/lib/email/templates.ts` holds all three emails. They use
the same palette as the site (`src/app/globals.css`) with system-serif
fallbacks, since mail clients don't load web fonts. All interpolated content is
HTML-escaped, and every email ships a plain-text alternative.

**Swapping providers.** The transport is one small module,
`src/lib/email/send.ts`. It exposes a single `sendEmail(env, message)` and
nothing above it knows about Cloudflare, so moving to another sender means
rewriting that file and nothing else.

**Sending quota.** Workers Paid includes 3,000 outbound emails a month, then
$0.35 per 1,000. Sends to verified destination addresses in the account are
free and don't count. New accounts start on a conservative daily limit that
rises automatically with sending reputation.
