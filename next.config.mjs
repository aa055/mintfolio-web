import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Pull the Supabase host out of the public env so signed download URLs
// (https://<project>.supabase.co/storage/v1/...) can flow through next/image.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseHost;
try {
  supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : undefined;
} catch {
  supabaseHost = undefined;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  // Pin the file-tracing root to this project so Next doesn't pick up a
  // stray package-lock.json higher in the user's home directory.
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
