import pkg from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const { PrismaClient } = pkg;

type PrismaClientType = InstanceType<typeof PrismaClient>;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClientType };

// Pool do Postgres usando DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Adapter do Prisma 7 para Postgres
const adapter = new PrismaPg(pool);

// Prisma Client (reaproveita em dev pra não abrir várias conexões)
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;