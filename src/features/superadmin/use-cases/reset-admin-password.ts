import bcrypt from "bcryptjs";
import { findAdminUsuario, setAdminPassword } from "../repositories/clientes-repository";
import type { SuperAdminMutationResult } from "../types";

/** Restablece la contraseña del usuario administrador (login "admin") de un cliente. */
export async function resetAdminPasswordUseCase(
  idCliente: number,
  password: string,
): Promise<SuperAdminMutationResult> {
  const admin = await findAdminUsuario(idCliente);
  if (!admin) {
    return { ok: false, error: "Este cliente no tiene un usuario administrador." };
  }

  await setAdminPassword(admin.id, idCliente, bcrypt.hashSync(password, 10));
  return { ok: true, id: admin.id };
}
