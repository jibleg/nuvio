import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

/**
 * Cliente de base de datos (Drizzle sobre postgres.js).
 * Se reutiliza una única conexión por proceso; en desarrollo se cachea en el
 * objeto global para sobrevivir al hot-reload de Next y no agotar conexiones.
 */
const globalForDb = globalThis as unknown as {
  __nuvioSql?: ReturnType<typeof postgres>;
};

const client = globalForDb.__nuvioSql ?? postgres(env.DATABASE_URL, { max: 10 });

if (env.NODE_ENV !== "production") {
  globalForDb.__nuvioSql = client;
}

export const db = drizzle(client, { schema });
