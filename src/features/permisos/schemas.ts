import { z } from "zod";

/** Un código de permiso es la llave que consulta el RBAC (p. ej. `usuarios.acceso`). */
const codigoField = z
  .string()
  .trim()
  .min(2, "Mínimo 2 caracteres")
  .regex(/^[a-z0-9._-]+$/, "Solo minúsculas, números y . _ -");

export const createPermisoSchema = z.object({
  nombre: z.string().trim().min(1, "Requerido"),
  codigo: codigoField,
  idModulo: z.number().int(),
});

export const updatePermisoSchema = createPermisoSchema.extend({
  activo: z.boolean(),
});

export type CreatePermisoInput = z.input<typeof createPermisoSchema>;
export type UpdatePermisoInput = z.input<typeof updatePermisoSchema>;
