import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Gives `next dev` the real Cloudflare bindings (D1, vars) from wrangler.jsonc.
initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  agentRules: false,
};

export default nextConfig;
