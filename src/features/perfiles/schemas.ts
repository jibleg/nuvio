import { z } from "zod";

const descripcionField = z
  .string()
  .transform((value) => {
    const limpio = value.trim();
    return limpio === "" ? null : limpio;
  });

export const createPerfilSchema = z.object({
  nombre: z.string().trim().min(1, "Requerido"),
  descripcion: descripcionField,
  permisos: z.array(z.number().int()),
});

export const updatePerfilSchema = createPerfilSchema.extend({
  activo: z.boolean(),
});

export type CreatePerfilInput = z.input<typeof createPerfilSchema>;
export type UpdatePerfilInput = z.input<typeof updatePerfilSchema>;
