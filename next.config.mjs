import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  // Pin the file-tracing root to this project so Next doesn't pick up a
  // stray package-lock.json higher in the user's home directory.
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
