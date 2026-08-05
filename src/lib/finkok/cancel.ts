import "server-only";
import type { FinkokCredentials } from "./credenciales";
import {
  buildCancelEnvelope,
  buildSatStatusEnvelope,
  interpretarCancelacion,
  interpretarEstatusSat,
  type DatosCancelacion,
  type EstatusSat,
  type RespuestaCancelacion,
} from "./cancel-soap";

/**
 * Cliente del servicio de **cancelación** de Finkok (endpoint SOAP `/cancel`).
 *
 * A diferencia del timbrado (que sella aquí y solo manda el XML), la cancelación
 * la firma Finkok con el CSD: por eso `cancel` recibe el `.cer` y la `.key` (ya
 * descifrada) en base64. Es el camino estándar del PAC; el CSD viaja únicamente
 * en esta llamada.
 */

const TIMEOUT_MS = 45000;

type ResultadoRed<T> = T | { ok: false; mensaje: string };

/** POST del sobre SOAP al endpoint `/cancel`, con timeout y errores de red claros. */
async function postSoap(creds: FinkokCredentials, envelope: string): Promise<{ texto: string } | { error: string }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${creds.base}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "text/xml; charset=utf-8", SOAPAction: "" },
      body: envelope,
      signal: ctrl.signal,
    });
    return { texto: await res.text() };
  } catch (e) {
    const abortado = e instanceof Error && e.name === "AbortError";
    return {
      error: abortado
        ? "El PAC no respondió a tiempo. Vuelve a intentar; si la solicitud ya se envió, la verás reflejada."
        : "No se pudo conectar con el PAC para cancelar. Revisa la conexión y vuelve a intentar.",
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Solicita la cancelación de un CFDI ante el SAT vía Finkok. */
export async function cancelarConFinkok(
  creds: FinkokCredentials,
  datos: DatosCancelacion,
): Promise<RespuestaCancelacion> {
  const r = await postSoap(creds, buildCancelEnvelope(creds, datos));
  if ("error" in r) {
    return { ok: false, estatusUuid: null, estatusCancelacion: null, acuse: null, fecha: null, codEstatus: null, mensaje: r.error };
  }
  return interpretarCancelacion(r.texto);
}

/** Consulta el estado real del CFDI ante el SAT (para resolver las "En proceso"). */
export async function consultarEstatusSat(
  creds: FinkokCredentials,
  q: { rfcEmisor: string; rfcReceptor: string; uuid: string; total: string },
): Promise<ResultadoRed<EstatusSat>> {
  const r = await postSoap(creds, buildSatStatusEnvelope(creds, q));
  if ("error" in r) return { ok: false, mensaje: r.error };
  const parsed = interpretarEstatusSat(r.texto);
  if ("error" in parsed) return { ok: false, mensaje: parsed.error };
  return parsed;
}

export type { DatosCancelacion, EstatusSat, RespuestaCancelacion };
