import { createHash, randomBytes } from "node:crypto";

/**
 * El token de sesión viaja en la cookie httpOnly en claro, pero en la base de
 * datos solo se guarda su hash SHA-256. Así, un volcado de la tabla `sesiones`
 * no permite reconstruir cookies válidas.
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
