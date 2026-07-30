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

export const sucursalFormSchema = z.object({
  nombreComercial: z.string().trim().min(1, "Requerido"),
  nombreCorto: optionalText,
  calle: optionalText,
  colonia: optionalText,
  ciudad: optionalText,
  codigoPostal: optionalCodigoPostal,
  telefono: optionalText,
  email: optionalEmail,
});
export type SucursalFormInput = z.input<typeof sucursalFormSchema>;

export const updateSucursalSchema = sucursalFormSchema.extend({
  activo: z.boolean(),
});
export type UpdateSucursalInput = z.input<typeof updateSucursalSchema>;
