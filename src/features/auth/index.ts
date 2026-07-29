/**
 * Superficie pública del feature de autenticación.
 * Orquesta la sesión componiendo RBAC (permisos) y empresas (multiempresa).
 */
export type { SessionContext, SessionUser } from "./types";
export { getCurrentSessionContext } from "./use-cases/get-current-session-context";
export { requireSession, requirePermission, requireModulo } from "./guards";
export { loginAction, logoutAction, switchEmpresaAction } from "./actions";
export { SessionProvider, useSession } from "./components/SessionProvider";
export { LoginScreen } from "./components/LoginScreen";
export { DashboardHeader } from "./components/DashboardHeader";
export { Can } from "./components/Can";
