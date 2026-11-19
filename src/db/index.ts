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

type Database = ReturnType<typeof connect>;
const globalForDb = globalThis as unknown as { db?: Database };

/** One connection per server process (survives hot reload in development). */
function instance(): Database {
  return (globalForDb.db ??= connect());
}

/**
 * The database, connected on first use rather than on import. Importing it is free,
 * so the build (which loads route modules in several workers) never opens the
 * local PGlite folder concurrently.
 */
export const db = new Proxy({} as Database, {
  get(_target, prop) {
    const real = instance();
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});
export { schema };
