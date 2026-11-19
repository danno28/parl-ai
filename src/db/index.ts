import "server-only";
import { mkdirSync } from "node:fs";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import { PGlite } from "@electric-sql/pglite";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Database connection.
 * - DATABASE_URL=postgres://…  → real PostgreSQL (production, T-6)
 * - unset or "pglite:<dir>"    → embedded PostgreSQL in ./.data/pglite for local development
 */
function connect() {
  const url = process.env.DATABASE_URL ?? "pglite:./.data/pglite";
  if (url.startsWith("pglite:")) {
    const dir = url.slice("pglite:".length);
    mkdirSync(dir, { recursive: true });
    return drizzlePglite({ client: new PGlite(dir), schema });
  }
  return drizzlePostgres({ client: postgres(url), schema });
}

const globalForDb = globalThis as unknown as { db?: ReturnType<typeof connect> };

/** One connection per server process (survives hot reload in development). */
export const db = globalForDb.db ?? (globalForDb.db = connect());
export { schema };
