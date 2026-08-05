import { z } from "zod";

const idRequerido = (mensaje: string) =>
  z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .refine((v) => Number.isInteger(v) && v > 0, mensaje);

const conceptoSchema = z.object({
  idServicio: idRequerido("Selecciona una clave de producto/servicio"),
  claveProdServ: z.string().trim().default(""),
  idUnidad: idRequerido("Selecciona una unidad"),
  claveUnidad: z.string().trim().default(""),
  descripcion: z.string().trim().min(1, "Requerido").max(1500),
  cantidad: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .refine((v) => Number.isInteger(v) && v > 0, "Cantidad entera mayor a 0"),
  valorUnitario: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .refine((v) => Number.isFinite(v) && v > 0, "Precio mayor a 0"),
  gravado: z.boolean().default(true),
});

export const borradorFormSchema = z.object({
  idEmpresaEmisora: idRequerido("Selecciona la empresa emisora"),
  idContactoFacturacion: idRequerido("Selecciona el cliente"),
  idUso: idRequerido("Selecciona el uso de CFDI"),
  idFormaPago: idRequerido("Selecciona la forma de pago"),
  idMetodo: idRequerido("Selecciona el método de pago"),
  idMoneda: idRequerido("Selecciona la moneda"),
  observacion: z
    .string()
    .trim()
    .max(500)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .default(null),
  conceptos: z.array(conceptoSchema).min(1, "Agrega al menos un concepto"),
});
export type BorradorFormInput = z.input<typeof borradorFormSchema>;
