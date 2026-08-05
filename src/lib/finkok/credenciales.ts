import "server-only";
import { env } from "@/lib/env";

/**
 * Credenciales de la cuenta Finkok de Nuvio — una sola cuenta que timbra para
 * todos los tenants (decisión del usuario), distinta del CSD (que sí es por
 * empresa/tenant, ver `@/lib/crypto/secrets`). El ambiente lo decide
 * `corporativo.clientes.ambiente_timbrado`, no una elección por-request: un
 * cliente nuevo nace en `sandbox` y solo Nuvio lo pasa a `produccion`.
 */

export type AmbienteTimbrado = "sandbox" | "produccion";

export interface FinkokCredentials {
  usuario: string;
  password: string;
  ambiente: AmbienteTimbrado;
  /** URL base del servicio SOAP, sin el método (`/stamp`, `/cancel`, …). */
  base: string;
}

const BASE_SANDBOX = "https://demo-facturacion.finkok.com/servicios/soap";
const BASE_PRODUCCION = "https://facturacion.finkok.com/servicios/soap";

function requerida(valor: string | undefined, nombre: string): string {
  if (!valor) {
    throw new Error(`Falta configurar ${nombre} — no se puede timbrar sin las credenciales de Finkok.`);
  }
  return valor;
}

export function credencialesFinkok(ambiente: AmbienteTimbrado): FinkokCredentials {
  if (ambiente === "produccion") {
    return {
      usuario: requerida(env.FINKOK_PROD_USER, "FINKOK_PROD_USER"),
      password: requerida(env.FINKOK_PROD_PASSWORD, "FINKOK_PROD_PASSWORD"),
      ambiente,
      base: BASE_PRODUCCION,
    };
  }
  return {
    usuario: requerida(env.FINKOK_SANDBOX_USER, "FINKOK_SANDBOX_USER"),
    password: requerida(env.FINKOK_SANDBOX_PASSWORD, "FINKOK_SANDBOX_PASSWORD"),
    ambiente,
    base: BASE_SANDBOX,
  };
}
