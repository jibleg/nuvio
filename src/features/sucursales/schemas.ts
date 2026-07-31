import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .default(null);

const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .refine((v) => v === null || z.email().safeParse(v).success, "Correo inválido")
  .default(null);

/** Código postal mexicano: 5 dígitos, opcional. */
const optionalCodigoPostal = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .refine((v) => v === null || /^\d{5}$/.test(v), "5 dígitos")
  .transform((v) => (v === null ? null : Number(v)))
  .default(null);

/** RFC: opcional, solo letras y números, sin guiones ni espacios (igual que en superadmin). */
const optionalRfc = z
  .string()
  .trim()
  .toUpperCase()
  .max(13, "Máximo 13 caracteres")
  .regex(/^[A-Z0-9]*$/, "Solo letras y números")
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .default(null);

export const sucursalFormSchema = z
  .object({
    nombreComercial: z.string().trim().min(1, "Requerido"),
    nombreCorto: optionalText,
    /** Si es false, `razonSocialPropia`/`rfcPropio` se descartan y la sucursal hereda de la matriz. */
    usaFiscalPropio: z.boolean().default(false),
    razonSocialPropia: optionalText,
    rfcPropio: optionalRfc,
    calle: optionalText,
    colonia: optionalText,
    ciudad: optionalText,
    codigoPostal: optionalCodigoPostal,
    telefono: optionalText,
    email: optionalEmail,
  })
  .refine((data) => !data.usaFiscalPropio || (data.razonSocialPropia && data.rfcPropio), {
    message: "Captura razón social y RFC propios, o desactiva \"Razón social propia\"",
    path: ["razonSocialPropia"],
  });
export type SucursalFormInput = z.input<typeof sucursalFormSchema>;

export const updateSucursalSchema = sucursalFormSchema.and(z.object({ activo: z.boolean() }));
export type UpdateSucursalInput = z.input<typeof updateSucursalSchema>;
