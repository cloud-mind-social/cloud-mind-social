import { getCloudflareContext } from "@opennextjs/cloudflare";

export type AppEnv = {
  DB: D1Database;
  SITE_URL?: string;
  MAIL_FROM?: string;
  MAIL_REPLY_TO?: string;
  INQUIRY_NOTIFY_TO?: string;
  RESEND_API_KEY?: string;
  IP_HASH_SALT?: string;
  ADMIN_SETUP_TOKEN?: string;
};

export async function getEnv(): Promise<AppEnv> {
  const { env } = await getCloudflareContext({ async: true });
  return env as unknown as AppEnv;
}

export async function getDb(): Promise<D1Database> {
  const env = await getEnv();
  if (!env.DB) {
    throw new Error(
      "D1 binding `DB` is missing. Add it to wrangler.jsonc and run the migrations.",
    );
  }
  return env.DB;
}

/**
 * Absolute origin for links inside emails. Falls back to the request host so
 * preview deployments still produce clickable links.
 */
export function siteUrl(env: AppEnv, requestOrigin?: string): string {
  return (env.SITE_URL || requestOrigin || "https://cloudmindsocial.com").replace(
    /\/+$/,
    "",
  );
}
