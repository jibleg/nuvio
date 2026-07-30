import { redirect } from "next/navigation";
import { ROUTES } from "@/config/routes";
import { getCurrentSuperAdminSession } from "./use-cases/get-super-admin-session";
import type { SuperAdminSessionContext } from "./types";

/** Exige sesión de staff válida; si no la hay, envía al login del panel interno. */
export async function requireSuperAdminSession(): Promise<SuperAdminSessionContext> {
  const session = await getCurrentSuperAdminSession();
  if (!session) redirect(ROUTES.superadminLogin);
  return session;
}
