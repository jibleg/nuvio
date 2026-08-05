import "server-only";
import type { FinkokCredentials } from "./credenciales";
import { buildStampEnvelope, parseFinkokResponse, type FinkokTestResult } from "./soap";

/**
 * Cliente mínimo del PAC Finkok (SOAP). Por ahora solo prueba de conexión:
 * autentica contra el servicio de timbrado sin consumir folios.
 *
 * Estrategia: se envía un `stamp` con un XML de prueba inválido. Finkok valida
 * primero las credenciales; si son incorrectas responde con CodigoError 300
 * ("El usuario o contraseña son inválidos"). Cualquier otra respuesta con
 * `stampResponse` significa que la autenticación pasó (el XML de prueba se
 * rechaza después, sin gastar timbre).
 */

// Se re-exporta para no romper a quien lo importe desde `@/lib/finkok/client`.
export type { FinkokTestResult };

const TIMEOUT_MS = 15000;

export async function probarConexionFinkok(creds: FinkokCredentials): Promise<FinkokTestResult> {
  const endpoint = `${creds.base}/stamp`;
  const envelope = buildStampEnvelope(creds);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  let text: string;
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "text/xml; charset=utf-8", SOAPAction: "" },
      body: envelope,
      signal: ctrl.signal,
    });
    text = await res.text();
    if (!res.ok && !text.includes("stampResponse")) {
      return { ok: false, kind: "red", message: `El servidor de Finkok respondió HTTP ${res.status}.` };
    }
  } catch (e) {
    const aborted = e instanceof Error && e.name === "AbortError";
    return {
      ok: false,
      kind: "red",
      message: aborted
        ? "Tiempo de espera agotado al conectar con Finkok."
        : "No se pudo conectar con Finkok. Revisa la red o el endpoint.",
    };
  } finally {
    clearTimeout(timer);
  }

  return parseFinkokResponse(text, creds);
}
