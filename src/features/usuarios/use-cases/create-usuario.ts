import bcrypt from "bcryptjs";
import {
  createUsuario,
  existsLogin,
} from "../repositories/usuarios-admin-repository";
import type { UsuarioMutationResult } from "../types";

export type CreateUsuarioData = {
  login: string;
  nombre: string;
  email: string | null;
  password: string;
  perfiles: number[];
  empresas: number[];
  modulos: string[];
};

export async function createUsuarioUseCase(
  data: CreateUsuarioData,
): Promise<UsuarioMutationResult> {
  if (await existsLogin(data.login)) {
    return { ok: false, error: "Ya existe un usuario con ese login." };
  }

  const id = await createUsuario({
    login: data.login,
    passwordHash: bcrypt.hashSync(data.password, 10),
    nombre: data.nombre,
    email: data.email,
    perfilIds: data.perfiles,
    empresaIds: data.empresas,
    moduloKeys: data.modulos,
  });

  return { ok: true, id };
}
