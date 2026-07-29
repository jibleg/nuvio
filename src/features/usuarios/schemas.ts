import { z } from "zod";

const emailOpcional = z
  .union([z.literal(""), z.email("Correo inválido")])
  .transform((value) => (value === "" ? null : value));

const perfilesField = z
  .array(z.number().int())
  .min(1, "Selecciona al menos un perfil");
const empresasField = z.array(z.number().int());
const modulosField = z.array(z.string());

/** Alta de usuario: la contraseña es obligatoria. */
export const createUsuarioSchema = z.object({
  login: z.string().trim().min(3, "Mínimo 3 caracteres"),
  nombre: z.string().trim().min(1, "Requerido"),
  email: emailOpcional,
  password: z.string().min(6, "Mínimo 6 caracteres"),
  perfiles: perfilesField,
  empresas: empresasField,
  modulos: modulosField,
});

/** Edición: el login no cambia; la contraseña es opcional (vacía = sin cambio). */
export const updateUsuarioSchema = z.object({
  nombre: z.string().trim().min(1, "Requerido"),
  email: emailOpcional,
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
