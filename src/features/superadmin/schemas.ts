import { z } from "zod";
import { RESERVED_SUBDOMAINS } from "@/lib/tenant/constants";
import { getPlan, PLANES, type PlanKey } from "@/config/plans";

const PLAN_KEYS = PLANES.map((plan) => plan.key) as [PlanKey, ...PlanKey[]];
const planField = z.enum(PLAN_KEYS, "Selecciona un plan");

/** Los módulos de negocio elegidos no pueden exceder el límite del plan contratado. */
function refineModulosPorPlan<T extends { plan: string; modulos: string[] }>(
  data: T,
  ctx: z.RefinementCtx,
) {
  const plan = getPlan(data.plan);
  if (!plan || plan.maxModulosNegocio === null) return;
  if (data.modulos.length > plan.maxModulosNegocio) {
    ctx.addIssue({
      code: "custom",
      path: ["modulos"],
      message: `El plan ${plan.nombre} incluye hasta ${plan.maxModulosNegocio} módulo(s) de negocio.`,
    });
  }
}

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

/** RFC: opcional, pero si se ingresa solo acepta letras y números, sin guiones ni espacios. */
const rfcField = z
  .string()
  .trim()
  .toUpperCase()
  .max(13, "Máximo 13 caracteres")
  .regex(/^[A-Z0-9]*$/, "Solo letras y números")
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .default(null);

export const onboardClienteSchema = z
  .object({
    clienteNombre: z.string().trim().min(1, "Requerido"),
    slug: slugField,
    plan: planField,
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
    empresaRfc: rfcField,
    adminNombre: z.string().trim().min(1, "Requerido"),
    adminEmail: emailField,
    adminPassword: z
      .string()
      .min(1, "La contraseña es obligatoria")
      .min(6, "Mínimo 6 caracteres"),
    modulos: z.array(z.string()),
  })
  .superRefine(refineModulosPorPlan);
export type OnboardClienteInput = z.input<typeof onboardClienteSchema>;

export const updateClienteSchema = z
  .object({
    nombre: z.string().trim().min(1, "Requerido"),
    activo: z.boolean(),
    plan: planField,
    modulos: z.array(z.string()),
  })
  .superRefine(refineModulosPorPlan);
export type UpdateClienteInput = z.input<typeof updateClienteSchema>;

export const resetAdminPasswordSchema = z.object({
  password: z.string().min(6, "Mínimo 6 caracteres"),
});
export type ResetAdminPasswordInput = z.input<typeof resetAdminPasswordSchema>;

const passwordField = z
  .string()
  .min(1, "La contraseña es obligatoria")
  .min(6, "Mínimo 6 caracteres");

export const crearStaffSchema = z.object({
  nombre: z.string().trim().min(1, "Requerido"),
  email: emailField,
  password: passwordField,
});
export type CrearStaffInput = z.input<typeof crearStaffSchema>;

export const actualizarStaffSchema = z.object({
  nombre: z.string().trim().min(1, "Requerido"),
  email: emailField,
  activo: z.boolean(),
});
export type ActualizarStaffInput = z.input<typeof actualizarStaffSchema>;

export const resetStaffPasswordSchema = z.object({
  password: passwordField,
});
export type ResetStaffPasswordInput = z.input<typeof resetStaffPasswordSchema>;
