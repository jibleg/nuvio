import { hashSessionToken } from "@/lib/auth/tokens";
import { readSuperAdminSessionCookie } from "@/lib/auth/superadmin-session-cookie";
import { findSuperAdminSesionVigente } from "../repositories/super-admins-repository";
import type { SuperAdminSessionContext } from "../types";

/** Contexto de sesión del panel interno a partir de la cookie httpOnly. */
export async function getCurrentSuperAdminSession(): Promise<SuperAdminSessionContext | null> {
  const token = await readSuperAdminSessionCookie();
  if (!token) return null;

  const found = await findSuperAdminSesionVigente(hashSessionToken(token));
  if (!found) return null;

  return {
    superAdmin: {
      id: found.superAdmin.id,
      nombre: found.superAdmin.nombre,
      email: found.superAdmin.email,
    },
  };
}
