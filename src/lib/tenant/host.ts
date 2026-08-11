import { RESERVED_SUBDOMAINS } from "./constants";

/**
 * Dominio base de la app (sin subdominio de tenant), derivado de `APP_URL`
 * directamente de `process.env` (no del `env` validado de `@/lib/env`: este
 * módulo lo importa `proxy.ts`, que corre en Edge Middleware, y no vale la
 * pena arrastrar ahí todo el schema de Zod con sus variables de Finkok/
 * SparkPost solo para leer una URL). Con `APP_URL` sin definir cae a
 * `localhost`, igual que el default de `@/lib/env`.
 *
 * ⚠️ Bug real encontrado en el primer deploy a producción (2026-08-11): el
 * dominio de Nuvio en producción es `nuvio.proyectosolmeca.com` (3 labels,
 * porque vive bajo el dominio compartido del VPS, no un `nuvio.com` propio
 * de 2 labels). La heurística anterior asumía SIEMPRE 2 labels de base fuera
 * de localhost (`minLabels = 3`), así que en ese dominio real el propio host
 * raíz `nuvio.proyectosolmeca.com` YA tenía 3 labels y se interpretaba como
 * si "nuvio" fuera el slug de un tenant — bloqueaba `/superadmin` (que exige
 * NO tener slug) incluso en el dominio raíz correcto. Derivar el base host
 * de `APP_URL` en vez de contar labels a ciegas generaliza a cualquier forma
 * de dominio base, sin importar cuántos labels tenga.
 */
const BASE_HOST = (() => {
  try {
    return new URL(process.env.APP_URL ?? "http://localhost:3000").hostname.toLowerCase();
  } catch {
    return "localhost";
  }
})();

/**
 * Extrae el slug del tenant a partir del Host de la petición.
 *
 * - `acme.localhost:3010` (con `APP_URL=http://localhost:3000`) → "acme"
 * - `israel.nuvio.proyectosolmeca.com` (con `APP_URL=https://nuvio.proyectosolmeca.com`) → "israel"
 * - el dominio base exacto (sin subdominio) → null
 * - subdominios reservados (www, app, …) → null
 *
 * El slug es lo que sobra del host una vez quitado el sufijo `.{BASE_HOST}`
 * — así no importa cuántos labels tenga el dominio base.
 */
export function slugFromHost(host: string | null | undefined): string | null {
  if (!host) return null;

  const hostname = host.split(":")[0].trim().toLowerCase();
  if (!hostname || hostname === BASE_HOST) return null;

  // Direcciones IP no llevan subdominio de tenant.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return null;

  const suffix = `.${BASE_HOST}`;
  if (!hostname.endsWith(suffix)) return null;

  const slug = hostname.slice(0, -suffix.length);
  if (!slug || slug.includes(".") || RESERVED_SUBDOMAINS.has(slug)) return null;

  return slug;
}
