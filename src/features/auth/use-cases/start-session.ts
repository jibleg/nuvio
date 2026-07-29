import { SESSION_DURATION_SECONDS } from "@/lib/auth/constants";
import { generateSessionToken, hashSessionToken } from "@/lib/auth/tokens";
import { createSesion } from "../repositories/sesiones-repository";

/**
 * Crea una sesión server-side y devuelve el token en claro para depositarlo en
 * la cookie. En la BD solo queda el hash del token.
 */
export async function startSession(
  usuarioId: number,
  idCliente: number,
  meta: { ip: string | null; userAgent: string | null },
): Promise<string> {
  const token = generateSessionToken();
  const fechaExpira = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);

  await createSesion({
    tokenHash: hashSessionToken(token),
    idUsuario: usuarioId,
    idCliente,
    fechaExpira,
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  return token;
}
