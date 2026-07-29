import bcrypt from "bcryptjs";
import { findUsuarioByLogin } from "../repositories/usuarios-repository";

export type AuthResult =
  | { ok: true; usuarioId: number }
  | { ok: false; reason: "invalid_credentials" | "inactive" | "must_reset" };

/**
 * Verifica credenciales contra el hash bcrypt almacenado.
 * Los usuarios legacy sin hash bcrypt (`$2…`) requieren restablecer contraseña
 * antes de poder entrar; no se intenta comparar en texto plano.
 */
export async function authenticateUser(
  login: string,
  password: string,
): Promise<AuthResult> {
  const usuario = await findUsuarioByLogin(login);
  if (!usuario) return { ok: false, reason: "invalid_credentials" };
  if (usuario.activo === 0) return { ok: false, reason: "inactive" };

  const hash = usuario.passwordHash;
  if (!hash.startsWith("$2")) return { ok: false, reason: "must_reset" };

  const matches = await bcrypt.compare(password, hash);
  if (!matches) return { ok: false, reason: "invalid_credentials" };

  return { ok: true, usuarioId: usuario.id };
}
