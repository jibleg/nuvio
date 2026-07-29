import { z } from "zod";

/**
 * Validated environment variables — the single source of truth for config
 * that comes from the runtime environment. Import `env` instead of reading
 * `process.env` directly so that a missing or malformed variable fails loudly
 * at startup instead of surfacing as an undefined value deep in the app.
 *
 * Add new variables to the schema below; never read `process.env.X` elsewhere.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.url({ error: "DATABASE_URL must be a valid URL" }),
  APP_URL: z.url().default("http://localhost:3000"),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${issues}`);
  }

  return parsed.data;
}

export const env = loadEnv();
