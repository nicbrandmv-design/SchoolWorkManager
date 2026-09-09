import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Driver adapters (over the standard `pg` driver) instead of Prisma's native
// query engine binary: serverless hosts like Vercel bundle each route into
// its own function via file tracing, which repeatedly failed to reliably
// ship the platform-specific .so.node engine binary. This removes that
// native binary dependency entirely.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
