import type { Config } from "drizzle-kit";

/**
 * Config de drizzle-kit para introspección/generación contra la BD `nuvio`.
 * Las migraciones se versionan en SQL bajo src/lib/db/migrations.
 */
export default {
  dialect: "postgresql",
  schema: "./src/lib/db/schema",
  out: "./src/lib/db/migrations",
  schemaFilter: ["administracion", "corporativo"],
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
} satisfies Config;
