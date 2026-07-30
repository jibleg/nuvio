import bcrypt from "bcryptjs";
import {
  createUsuario,
  existsEmail,
  existsLogin,
} from "../repositories/usuarios-admin-repository";
import type { UsuarioMutationResult } from "../types";

export type CreateUsuarioData = {
  login: string;
  nombre: string;
  email: string;
  password: string;
  perfiles: number[];
  empresas: number[];
  modulos: string[];
};

export async function createUsuarioUseCase(
  data: CreateUsuarioData,
  idCliente: number,
): Promise<UsuarioMutationResult> {
  if (await existsLogin(data.login, idCliente)) {
    return { ok: false, error: "Ya existe un usuario con ese login." };
  }
  if (await existsEmail(data.email, idCliente)) {
    return { ok: false, error: "Ya existe un usuario con ese correo." };
  }

  const id = await createUsuario({
    idCliente,
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
