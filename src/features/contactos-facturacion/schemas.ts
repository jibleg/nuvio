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

/** RFC: requerido (a diferencia del de sucursales, aquí no hay matriz de quién heredar). */
const rfcField = z
  .string()
  .trim()
  .toUpperCase()
  .min(1, "Requerido")
  .max(13, "Máximo 13 caracteres")
  .regex(/^[A-Z0-9]+$/, "Solo letras y números");

/** Selector opcional que referencia un catálogo CFDI por id (régimen, uso, forma o método de pago). */
const optionalIdCatalogo = (mensaje: string) =>
  z
    .union([z.literal(""), z.string().regex(/^\d+$/, mensaje)])
    .transform((v) => (v === "" ? null : Number(v)))
    .nullable()
    .default(null);

export const contactoFormSchema = z.object({
  tipo: z.enum(["cliente", "proveedor"]),
  razonSocial: z.string().trim().min(1, "Requerido"),
  rfc: rfcField,
  nombreComercial: optionalText,
  calle: optionalText,
  colonia: optionalText,
  ciudad: optionalText,
  codigoPostal: optionalCodigoPostal,
  telefono: optionalText,
  email: optionalEmail,
  idRegimen: optionalIdCatalogo("Selecciona un régimen"),
  idUso: optionalIdCatalogo("Selecciona un uso de CFDI"),
  idFormaPago: optionalIdCatalogo("Selecciona una forma de pago"),
  idMetodo: optionalIdCatalogo("Selecciona un método de pago"),
});
export type ContactoFormInput = z.input<typeof contactoFormSchema>;

export const updateContactoSchema = contactoFormSchema.extend({
  activo: z.boolean(),
});
export type UpdateContactoInput = z.input<typeof updateContactoSchema>;
