import { z } from "zod";

/** Validación del formulario de acceso. Fuente de verdad del tipo LoginInput. */
export const loginSchema = z.object({
  login: z.string().trim().min(1, "Ingresa tu usuario"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});

export type LoginInput = z.infer<typeof loginSchema>;
