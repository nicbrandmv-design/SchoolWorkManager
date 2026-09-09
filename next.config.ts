import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma's generator outputs to a non-default location (app/generated/prisma
  // instead of node_modules/.prisma/client), so Next.js's automatic output
  // file tracing doesn't reliably detect the native query engine binary
  // (loaded dynamically at runtime, not via a static import) and leaves it
  // out of each route's deployed serverless bundle. Include it explicitly.
  outputFileTracingIncludes: {
    "/**": ["./app/generated/prisma/**/*"],
  },
};

export default nextConfig;
