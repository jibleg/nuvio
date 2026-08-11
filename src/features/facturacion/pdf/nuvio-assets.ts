import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";

const brandDir = path.join(process.cwd(), "public", "brand");

function leerComoDataUrl(nombre: string): string {
  const buffer = readFileSync(path.join(brandDir, nombre));
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

/**
 * Assets de marca de Nuvio embebidos como data URL, leídos una sola vez al
 * cargar el módulo (no en cada PDF). Dos usos, decisión del usuario
 * (2026-08-10):
 * - `NUVIO_ICON_DATA_URL`: respaldo en el header del PDF cuando la empresa
 *   emisora no subió su propio logo — nunca queda un hueco en blanco.
 * - `NUVIO_HORIZONTAL_DATA_URL`: wordmark del banner promocional al pie del
 *   documento (ver `PdfExtras.tsx`).
 */
export const NUVIO_ICON_DATA_URL = leerComoDataUrl("nuvio-icon.png");
export const NUVIO_HORIZONTAL_DATA_URL = leerComoDataUrl("nuvio-horizontal.png");
