import { cookies } from "next/headers";
import {
  SUPERADMIN_SESSION_COOKIE_NAME,
  SUPERADMIN_SESSION_DURATION_SECONDS,
} from "./constants";

/** Cookie httpOnly del panel interno. Nunca comparte nombre ni opciones con la de un tenant. */
export async function setSuperAdminSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SUPERADMIN_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SUPERADMIN_SESSION_DURATION_SECONDS,
  });
}

export async function readSuperAdminSessionCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get(SUPERADMIN_SESSION_COOKIE_NAME)?.value ?? null;
}

export async function clearSuperAdminSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SUPERADMIN_SESSION_COOKIE_NAME);
}
