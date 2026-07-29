import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, SESSION_DURATION_SECONDS } from "./constants";

/**
 * Lectura/escritura de la cookie httpOnly que transporta el token de sesión.
 * Toda manipulación de la cookie pasa por aquí para mantener las mismas
 * opciones de seguridad en un solo lugar.
 */
export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function readSessionCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}
