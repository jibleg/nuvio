import bcrypt from "bcryptjs";
import {
  existsEmail,
  updateUsuario,
} from "../repositories/usuarios-admin-repository";
import type { UsuarioMutationResult } from "../types";

export type UpdateUsuarioData = {
  nombre: string;
  email: string;
  password: string | null;
  activo: boolean;
  perfiles: number[];
  empresas: number[];
  modulos: string[];
};

export async function updateUsuarioUseCase(
  id: number,
  data: UpdateUsuarioData,
  currentUserId: number,
  idCliente: number,
): Promise<UsuarioMutationResult> {
  if (id === currentUserId && !data.activo) {
    return { ok: false, error: "No puedes desactivar tu propia cuenta." };
  }
  if (await existsEmail(data.email, idCliente, id)) {
    return { ok: false, error: "Ya existe un usuario con ese correo." };
  }

  await updateUsuario(id, idCliente, {
    nombre: data.nombre,
    email: data.email,
    passwordHash: data.password ? bcrypt.hashSync(data.password, 10) : null,
    activo: data.activo,
    perfilIds: data.perfiles,
    empresaIds: data.empresas,
    moduloKeys: data.modulos,
  });

  return { ok: true, id };
}
