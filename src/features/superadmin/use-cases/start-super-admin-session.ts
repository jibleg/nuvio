import { SUPERADMIN_SESSION_DURATION_SECONDS } from "@/lib/auth/constants";
import { generateSessionToken, hashSessionToken } from "@/lib/auth/tokens";
import { createSuperAdminSesion } from "../repositories/super-admins-repository";

export async function startSuperAdminSession(
  superAdminId: number,
  meta: { ip: string | null; userAgent: string | null },
): Promise<string> {
  const token = generateSessionToken();
  const fechaExpira = new Date(Date.now() + SUPERADMIN_SESSION_DURATION_SECONDS * 1000);

  await createSuperAdminSesion({
    tokenHash: hashSessionToken(token),
    idSuperAdmin: superAdminId,
    fechaExpira,
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  return token;
}
