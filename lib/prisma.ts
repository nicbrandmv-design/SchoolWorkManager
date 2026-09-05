import path from "path";
import { PrismaClient } from "@/app/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// The Prisma CLI (migrate/studio) resolves a relative "file:" datasource URL
// relative to prisma/schema.prisma's directory, but @prisma/client resolves
// the same relative URL at runtime relative to process.cwd(). Those differ
// (cwd is the project root, one level up from prisma/), so without this the
// app and the CLI silently talk to two different SQLite files. Resolve it
// ourselves the same way the CLI does, relative to the prisma/ directory.
function resolveDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url?.startsWith("file:")) return url;
  const relativePath = url.slice("file:".length);
  return `file:${path.resolve(process.cwd(), "prisma", relativePath)}`;
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ datasourceUrl: resolveDatabaseUrl() });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
