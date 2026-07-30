/**
 * Superficie pública del panel interno de Nuvio: staff que gestiona el
 * catálogo de clientes (tenants). Auth aislada de `features/auth` a propósito.
 */
export type {
  SuperAdminSessionContext,
  SuperAdminUser,
  ClienteListItem,
  ClienteDetalle,
  SuperAdminStats,
} from "./types";
export { requireSuperAdminSession } from "./guards";
export { getCurrentSuperAdminSession } from "./use-cases/get-super-admin-session";
export {
  superAdminLoginAction,
  superAdminLogoutAction,
  onboardClienteAction,
  updateClienteAction,
  toggleClienteActivoAction,
  getClienteDetalleAction,
} from "./actions";
export { getClientesList, getClienteById, getSuperAdminStats } from "./queries";
export { SuperAdminLoginScreen } from "./components/SuperAdminLoginScreen";
export { SuperAdminShell } from "./components/SuperAdminShell";
export { ClientesAdmin } from "./components/ClientesAdmin";
