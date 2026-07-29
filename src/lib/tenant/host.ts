import { RESERVED_SUBDOMAINS } from "./constants";

/**
 * Extrae el slug del tenant a partir del Host de la petición.
 *
 * - `acme.localhost:3010`      → "acme"
 * - `acme.nuvio.com`           → "acme"
 * - `localhost:3010` / `nuvio.com` (sin subdominio) → null
 * - subdominios reservados (www, app, …) → null
 *
 * Es una heurística deliberadamente simple: el primer label es el tenant
 * cuando hay un subdominio por delante del dominio base.
 */
export function slugFromHost(host: string | null | undefined): string | null {
  if (!host) return null;

  const hostname = host.split(":")[0].trim().toLowerCase();
  if (!hostname || hostname === "localhost") return null;

  // Direcciones IP no llevan subdominio de tenant.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return null;

  const labels = hostname.split(".");
  const esLocalhost = labels[labels.length - 1] === "localhost";

  // Necesitamos al menos un label + base: `sub.localhost` o `sub.dominio.tld`.
  const minLabels = esLocalhost ? 2 : 3;
  if (labels.length < minLabels) return null;

  const slug = labels[0];
  if (!slug || RESERVED_SUBDOMAINS.has(slug)) return null;

  return slug;
}
