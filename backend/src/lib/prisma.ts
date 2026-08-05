import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

if (!process.env.DATABASE_URL) {
  throw new Error("Falta DATABASE_URL en el .env (ver .env.example)");
}

// Prisma 7 se conecta a través de un driver adapter, no de la URL del schema.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// Instancia única compartida por toda la app.
// En dev, tsx recarga el módulo en cada cambio; guardarla en globalThis evita
// abrir un pool nuevo de conexiones a Postgres en cada reload.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
