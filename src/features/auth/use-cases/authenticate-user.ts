import bcrypt from "bcryptjs";
import { findUsuarioByEmail } from "../repositories/usuarios-repository";

export type AuthResult =
  | { ok: true; usuarioId: number }
  | { ok: false; reason: "invalid_credentials" | "inactive" | "must_reset" };

/**
 * Verifica credenciales (email + contraseña) contra el hash bcrypt almacenado,
 * SIEMPRE acotado al cliente (tenant) del subdominio. Los usuarios legacy sin
 * hash bcrypt (`$2…`) requieren restablecer contraseña antes de poder entrar.
 */
export async function authenticateUser(
  email: string,
  password: string,
  idCliente: number,
): Promise<AuthResult> {
  const usuario = await findUsuarioByEmail(email, idCliente);
  if (!usuario) return { ok: false, reason: "invalid_credentials" };
  if (usuario.activo === 0) return { ok: false, reason: "inactive" };

  const hash = usuario.passwordHash;
  if (!hash.startsWith("$2")) return { ok: false, reason: "must_reset" };

  const matches = await bcrypt.compare(password, hash);
  if (!matches) return { ok: false, reason: "invalid_credentials" };

  return { ok: true, usuarioId: usuario.id };
}
