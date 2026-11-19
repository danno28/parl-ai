import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL ?? "pglite:./.data/pglite";
const isPglite = url.startsWith("pglite:");

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  ...(isPglite
    ? { driver: "pglite", dbCredentials: { url: url.slice("pglite:".length) } }
    : { dbCredentials: { url } }),
});
