import { z } from "zod";

/** El correo es obligatorio: es el identificador con el que el usuario inicia sesión. */
const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "El correo es obligatorio")
  .pipe(z.email("Correo inválido"));

const perfilesField = z
  .array(z.number().int())
  .min(1, "Selecciona al menos un perfil");
const empresasField = z.array(z.number().int());
const modulosField = z.array(z.string());

/** Alta de usuario: la contraseña es obligatoria. */
export const createUsuarioSchema = z.object({
  login: z.string().trim().min(3, "Mínimo 3 caracteres"),
  nombre: z.string().trim().min(1, "Requerido"),
  email: emailField,
  password: z
    .string()
    .min(1, "La contraseña es obligatoria")
    .min(6, "Mínimo 6 caracteres"),
  perfiles: perfilesField,
  empresas: empresasField,
  modulos: modulosField,
});

/** Edición: el login no cambia; la contraseña es opcional (vacía = sin cambio). */
export const updateUsuarioSchema = z.object({
  nombre: z.string().trim().min(1, "Requerido"),
  email: emailField,
  password: z
    .union([z.literal(""), z.string().min(6, "Mínimo 6 caracteres")])
    .transform((value) => (value === "" ? null : value)),
  activo: z.boolean(),
  perfiles: perfilesField,
  empresas: empresasField,
  modulos: modulosField,
});

export type CreateUsuarioInput = z.input<typeof createUsuarioSchema>;
export type UpdateUsuarioInput = z.input<typeof updateUsuarioSchema>;
