import { redirect } from "next/navigation";
import { ROUTES } from "@/config/routes";
import { hasPermission } from "@/features/rbac";
import { getCurrentSessionContext } from "./use-cases/get-current-session-context";
import type { SessionContext } from "./types";

/**
 * Guards server-side para el área autenticada. Se usan en layouts, pages y
 * Server Actions: cortan el acceso ANTES de renderizar o mutar, de modo que la
 * autorización nunca depende solo de la UI.
 */

/** Exige sesión válida; si no la hay, envía a login. Devuelve el contexto. */
export async function requireSession(): Promise<SessionContext> {
  const session = await getCurrentSessionContext();
  if (!session) redirect(ROUTES.login);
  return session;
}

/**
 * Exige sesión y un permiso concreto. Sin sesión → login; con sesión pero sin
 * el permiso → pantalla de "no autorizado". Devuelve el contexto ya autorizado.
 */
export async function requirePermission(
  codigo: string,
): Promise<SessionContext> {
  const session = await requireSession();
  if (!hasPermission(session.permisos, codigo)) {
    redirect(ROUTES.noAutorizado);
  }
  return session;
}

/**
 * Exige acceso a un módulo de aplicación (asociación operador↔módulo). Sin
 * acceso, devuelve al portal de módulos. Devuelve el contexto de sesión.
 */
export async function requireModulo(
  moduloKey: string,
): Promise<SessionContext> {
  const session = await requireSession();
  if (!session.modulos.includes(moduloKey)) {
    redirect(ROUTES.dashboard);
  }
  return session;
}
