/**
 * The per-tenant wiring, checked rather than trusted.
 *
 * This app is one brand's build of a client that several brands share, and the
 * three values below are exactly the ones that go wrong quietly:
 *
 *  - NEXT_PUBLIC_API_BASE_URL is inlined by Next at BUILD time. No Worker var,
 *    secret or binding can correct it afterwards, so a build carrying another
 *    tenant's API base is a build that talks to another tenant's mail. There is
 *    one build per tenant, and this is what proves which tenant it is.
 *  - WORKER_SELF_REFERENCE must name this Worker. Pointed at another one, the
 *    OpenNext cache calls land in that Worker and nothing errors.
 *  - The custom domain must be webmail.<the API's zone>, because the API's CORS
 *    origin and CSRF check are derived from ORG_DOMAIN and trust that one
 *    origin only.
 *
 * There is no test runner in this app, so this runs as a script —
 * `npm run test:tenant`. It reads the files, not the environment, so it gives
 * the same answer in CI, in a shell, and before a deploy.
 */
import { readFileSync } from "node:fs";

const ZONE = "cloudmindsocial.com";

let pass = 0, fail = 0;
const ok = (name: string, cond: boolean, detail = "") => {
  if (cond) { pass++; console.log(` ok   ${name}`); }
  else { fail++; console.log(`FAIL  ${name}  ${detail}`); }
};

const env = readFileSync(".env.production", "utf8");
const wrangler = readFileSync("wrangler.jsonc", "utf8");
const api = readFileSync("src/lib/api.ts", "utf8");

// Strip comments before parsing: the config is deliberately heavily commented.
const config = JSON.parse(
  wrangler.replace(/^\s*\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, ""),
) as {
  name: string;
  workers_dev?: boolean;
  preview_urls?: boolean;
  services?: { binding: string; service: string }[];
  routes?: { pattern: string; custom_domain?: boolean }[];
};

const envBase = /^NEXT_PUBLIC_API_BASE_URL=(.+)$/m.exec(env)?.[1]?.trim();
ok("the build points at this tenant's API",
  envBase === `https://api.${ZONE}`, `got ${envBase}`);

// The fallback matters on its own: if the env var ever goes missing, the build
// still has to fail closed onto this zone rather than another tenant's.
const codeBase = /\?\?\s*"([^"]+)"/.exec(api)?.[1];
ok("and so does the fallback in api.ts, for when the env var is missing",
  codeBase === `https://api.${ZONE}`, `got ${codeBase}`);

const selfRef = config.services?.find((s) => s.binding === "WORKER_SELF_REFERENCE");
ok("the self-reference names this Worker, not another tenant's",
  selfRef?.service === config.name, `${selfRef?.service} vs ${config.name}`);

const custom = config.routes?.filter((r) => r.custom_domain).map((r) => r.pattern) ?? [];
ok("the custom domain is the origin the API will trust",
  custom.length === 1 && custom[0] === `webmail.${ZONE}`, `got ${JSON.stringify(custom)}`);

ok("workers.dev is off, so the app has no untrusted origin",
  config.workers_dev === false, `got ${config.workers_dev}`);

ok("preview URLs are off, so no preview reaches real mail",
  config.preview_urls === false, `got ${config.preview_urls}`);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
