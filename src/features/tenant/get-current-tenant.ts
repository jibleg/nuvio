import { cache } from "react";
import { headers } from "next/headers";
import { TENANT_HEADER } from "@/lib/tenant/constants";
import { findClienteBySlug, type Cliente } from "./repositories/clientes-repository";

/**
 * Cliente (tenant) de la petición actual, resuelto desde el subdominio que el
 * proxy publicó en el header. `cache` lo memoiza por request para no repetir la
 * consulta en cada capa (layout, action, repositorio).
 */
export const getCurrentTenant = cache(async (): Promise<Cliente | null> => {
  const slug = (await headers()).get(TENANT_HEADER);
  if (!slug) return null;
  return findClienteBySlug(slug);
});
