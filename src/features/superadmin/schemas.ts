import { z } from "zod";
import { RESERVED_SUBDOMAINS } from "@/lib/tenant/constants";

export const superAdminLoginSchema = z.object({
  email: z.email("Ingresa un correo válido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});
export type SuperAdminLoginInput = z.infer<typeof superAdminLoginSchema>;

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "El correo es obligatorio")
  .pipe(z.email("Correo inválido"));

/** El slug es el subdominio del cliente: mismas reglas que una etiqueta DNS. */
const slugField = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Mínimo 2 caracteres")
  .max(63, "Máximo 63 caracteres")
  .regex(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    "Solo minúsculas, números y guiones (sin empezar ni terminar en guion)",
  )
  .refine((slug) => !RESERVED_SUBDOMAINS.has(slug), "Ese slug está reservado");

export const onboardClienteSchema = z.object({
  clienteNombre: z.string().trim().min(1, "Requerido"),
  slug: slugField,
  empresaNombreComercial: z.string().trim().min(1, "Requerido"),
  empresaNombreCorto: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .default(null),
  empresaRazonSocial: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .default(null),
  empresaRfc: z
    .string()
    .trim()
    .toUpperCase()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .default(null),
  adminNombre: z.string().trim().min(1, "Requerido"),
  adminEmail: emailField,
  adminPassword: z
    .string()
    .min(1, "La contraseña es obligatoria")
    .min(6, "Mínimo 6 caracteres"),
  modulos: z.array(z.string()),
});
export type OnboardClienteInput = z.input<typeof onboardClienteSchema>;

export const updateClienteSchema = z.object({
  nombre: z.string().trim().min(1, "Requerido"),
  activo: z.boolean(),
  modulos: z.array(z.string()),
});
export type UpdateClienteInput = z.input<typeof updateClienteSchema>;

export const resetAdminPasswordSchema = z.object({
  password: z.string().min(6, "Mínimo 6 caracteres"),
});
export type ResetAdminPasswordInput = z.input<typeof resetAdminPasswordSchema>;
