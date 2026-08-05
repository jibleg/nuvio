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

  /** Clave AES-256-GCM (32 bytes, base64) para cifrar secretos en reposo (CSD). */
  CSD_ENCRYPTION_KEY: z.base64().refine(
    (v) => Buffer.from(v, "base64").length === 32,
    "CSD_ENCRYPTION_KEY debe decodificar a 32 bytes",
  ),

  /**
   * Credenciales de la cuenta Finkok de Nuvio (una sola cuenta para todos los
   * tenants). Opcionales aquí a propósito: mientras no se configuren, el resto
   * de la app sigue funcionando; `credencialesFinkok()` (`@/lib/finkok/credenciales`)
   * es quien falla en voz alta, y solo cuando de verdad se intenta timbrar.
   */
  FINKOK_SANDBOX_USER: z.string().min(1).optional(),
  FINKOK_SANDBOX_PASSWORD: z.string().min(1).optional(),
  FINKOK_PROD_USER: z.string().min(1).optional(),
  FINKOK_PROD_PASSWORD: z.string().min(1).optional(),

  /**
   * Correo saliente vía SparkPost (transversal a todos los módulos, no solo
   * Facturación). Opcionales por el mismo motivo que Finkok arriba.
   */
  SPARKPOST_API_KEY: z.string().min(1).optional(),
  SPARKPOST_API_BASE: z.url().default("https://api.sparkpost.com/api/v1"),
  EMAIL_FROM: z.email().optional(),
  EMAIL_FROM_NAME: z.string().min(1).default("Nuvio"),

  /** SMS saliente vía LabsMobile (transversal, aún sin caso de uso construido). */
  LABSMOBILE_USERNAME: z.string().min(1).optional(),
  LABSMOBILE_API_TOKEN: z.string().min(1).optional(),
  LABSMOBILE_SENDER: z.string().min(1).optional(),
  LABSMOBILE_API_BASE: z.url().default("https://api.labsmobile.com/json/send"),
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
