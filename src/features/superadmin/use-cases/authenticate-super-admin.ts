import bcrypt from "bcryptjs";
import { findSuperAdminByEmail } from "../repositories/super-admins-repository";

export type SuperAdminAuthResult =
  | { ok: true; superAdminId: number }
  | { ok: false; reason: "invalid_credentials" | "inactive" };

/** Verifica credenciales del panel interno. Sin noción de tenant: no depende del subdominio. */
export async function authenticateSuperAdmin(
  email: string,
  password: string,
): Promise<SuperAdminAuthResult> {
  const superAdmin = await findSuperAdminByEmail(email);
  if (!superAdmin) return { ok: false, reason: "invalid_credentials" };
  if (superAdmin.activo === 0) return { ok: false, reason: "inactive" };

  const matches = await bcrypt.compare(password, superAdmin.passwordHash);
  if (!matches) return { ok: false, reason: "invalid_credentials" };

  return { ok: true, superAdminId: superAdmin.id };
}
