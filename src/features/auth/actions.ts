"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ROUTES } from "@/config/routes";
import {
  clearSessionCookie,
  readSessionCookie,
  setSessionCookie,
} from "@/lib/auth/session-cookie";
import { hashSessionToken } from "@/lib/auth/tokens";
import { usuarioTieneAccesoAEmpresa } from "@/features/empresas";
import { loginSchema, type LoginInput } from "./schemas";
import { authenticateUser } from "./use-cases/authenticate-user";
import { startSession } from "./use-cases/start-session";
import {
  actualizarEmpresaActiva,
  findSesionVigenteConUsuario,
  revocarSesion,
} from "./repositories/sesiones-repository";

export type LoginActionResult = { error: string };

export async function loginAction(
  input: LoginInput,
): Promise<LoginActionResult | void> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos." };

  const result = await authenticateUser(parsed.data.login, parsed.data.password);
  if (!result.ok) {
    if (result.reason === "inactive") return { error: "Usuario inactivo." };
    if (result.reason === "must_reset") {
      return {
        error:
          "Tu contraseña necesita restablecerse. Contacta al administrador.",
      };
    }
    return { error: "Usuario o contraseña incorrectos." };
  }

  const requestHeaders = await headers();
  const token = await startSession(result.usuarioId, {
    ip: requestHeaders.get("x-forwarded-for"),
    userAgent: requestHeaders.get("user-agent"),
  });
  await setSessionCookie(token);

  redirect(ROUTES.dashboard);
}

export async function logoutAction(): Promise<void> {
  const token = await readSessionCookie();
  if (token) await revocarSesion(hashSessionToken(token));
  await clearSessionCookie();
  redirect(ROUTES.login);
}

export async function switchEmpresaAction(idEmpresa: number): Promise<void> {
  const token = await readSessionCookie();
  if (!token) redirect(ROUTES.login);

  const tokenHash = hashSessionToken(token);
  const found = await findSesionVigenteConUsuario(tokenHash);
  if (!found) redirect(ROUTES.login);

  const tieneAcceso = await usuarioTieneAccesoAEmpresa(
    found.usuario.id,
    idEmpresa,
  );
  if (!tieneAcceso) return;

  await actualizarEmpresaActiva(tokenHash, idEmpresa);
  revalidatePath(ROUTES.dashboard, "layout");
}
