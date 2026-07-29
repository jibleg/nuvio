/**
 * Tenant (cliente) del SaaS: resuelto por subdominio. El proxy publica el slug
 * en un header y aquí se resuelve al cliente activo. Todo el modelo de datos se
 * aísla por `cve_cliente`; esta es la fuente del `clienteId` del contexto.
 */
export { getCurrentTenant } from "./get-current-tenant";
export { findClienteBySlug } from "./repositories/clientes-repository";
export type { Cliente } from "./repositories/clientes-repository";
