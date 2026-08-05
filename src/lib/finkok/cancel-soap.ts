import "server-only";
import type { FinkokCredentials } from "./credenciales";
import { escapeXml, extract } from "./soap";

/**
 * Helpers SOAP del servicio de **cancelación** de Finkok (endpoint `/cancel`).
 *
 * Se separan del orquestador (fetch + timeout de `cancel.ts`) para que estas
 * piezas —armar el sobre, clasificar la respuesta— sean puras y verificables sin
 * salir a la red. El contrato está tomado del WSDL de Finkok (cancel.wsdl):
 *   - `cancel`         → solicita la cancelación (motivo + folio de sustitución).
 *   - `get_sat_status` → consulta el estado real del CFDI ante el SAT.
 *
 * En `cancel`, el motivo y el folio de sustitución viajan como **atributos** del
 * elemento `<UUID>`, no como elementos hijos (así lo define el WSDL).
 */

/** Los cuatro motivos de cancelación del SAT (catálogo `cfdi.motivo_cancelacion`). */
export type CodigoMotivo = "01" | "02" | "03" | "04";

export interface DatosCancelacion {
  /** Folio fiscal (UUID) a cancelar. */
  uuid: string;
  motivo: CodigoMotivo;
  /** UUID que sustituye al cancelado. Solo con motivo 01; en el resto va vacío. */
  folioSustitucion: string;
  /** RFC de la empresa que emitió (y que cancela). */
  rfcEmisor: string;
  /** Certificado del CSD en **PEM**, codificado en base64 (Finkok rechaza el DER). */
  cerB64: string;
  /** Llave privada del CSD ya descifrada, en **PEM PKCS#8** codificado en base64. */
  keyB64: string;
}

/**
 * Sobre SOAP del método `cancel`.
 *
 * `store_pending=false`: no queremos que Finkok guarde la solicitud para
 * reintentarla sola; el reintento lo maneja el operador desde la pantalla.
 */
export function buildCancelEnvelope(creds: FinkokCredentials, d: DatosCancelacion): string {
  const folioAttr = d.folioSustitucion ? ` FolioSustitucion="${escapeXml(d.folioSustitucion)}"` : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:can="http://facturacion.finkok.com/cancel" xmlns:apps="apps.services.soap.core.views">
  <soapenv:Header/>
  <soapenv:Body>
    <can:cancel>
      <can:UUIDS>
        <apps:UUID UUID="${escapeXml(d.uuid)}" Motivo="${d.motivo}"${folioAttr}/>
      </can:UUIDS>
      <can:username>${escapeXml(creds.usuario)}</can:username>
      <can:password>${escapeXml(creds.password)}</can:password>
      <can:taxpayer_id>${escapeXml(d.rfcEmisor)}</can:taxpayer_id>
      <can:cer>${d.cerB64}</can:cer>
      <can:key>${d.keyB64}</can:key>
      <can:store_pending>false</can:store_pending>
    </can:cancel>
  </soapenv:Body>
</soapenv:Envelope>`;
}

/** Sobre SOAP del método `get_sat_status` (consulta el estado del CFDI ante el SAT). */
export function buildSatStatusEnvelope(
  creds: FinkokCredentials,
  q: { rfcEmisor: string; rfcReceptor: string; uuid: string; total: string },
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:can="http://facturacion.finkok.com/cancel">
  <soapenv:Header/>
  <soapenv:Body>
    <can:get_sat_status>
      <can:username>${escapeXml(creds.usuario)}</can:username>
      <can:password>${escapeXml(creds.password)}</can:password>
      <can:taxpayer_id>${escapeXml(q.rfcEmisor)}</can:taxpayer_id>
      <can:rtaxpayer_id>${escapeXml(q.rfcReceptor)}</can:rtaxpayer_id>
      <can:uuid>${escapeXml(q.uuid)}</can:uuid>
      <can:total>${escapeXml(q.total)}</can:total>
    </can:get_sat_status>
  </soapenv:Body>
</soapenv:Envelope>`;
}

/** Lo que el SAT dice del CFDI (respuesta de `get_sat_status`). */
export interface EstatusSat {
  /** "Vigente" | "Cancelado" | "No Encontrado" | ... */
  estado: string | null;
  /** "Cancelable sin aceptación" | "Cancelable con aceptación" | "No cancelable". */
  esCancelable: string | null;
  /** "" | "En proceso" | "Cancelado sin aceptación" | "Plazo vencido" | "Solicitud rechazada". */
  estatusCancelacion: string | null;
  codigoEstatus: string | null;
}

/** Resultado de una solicitud de cancelación (respuesta de `cancel`). */
export interface RespuestaCancelacion {
  ok: boolean;
  /** Código por folio que devuelve el SAT: 201 = cancelado, 202 = ya estaba cancelado. */
  estatusUuid: string | null;
  /** Estado de cancelación del folio: puede quedar "En proceso" si requiere aceptación. */
  estatusCancelacion: string | null;
  /** Acuse XML del PAC (se guarda como comprobante). */
  acuse: string | null;
  fecha: string | null;
  /** Código general de la operación; útil para el registro. */
  codEstatus: string | null;
  /** Mensaje ya legible para el operador cuando algo falla. */
  mensaje: string | null;
}

/** Códigos de `EstatusUUID` que significan que el folio quedó cancelado. */
const CANCELADO_OK = new Set(["201", "202"]);

/**
 * Clasifica la respuesta del `cancel`. Se separa del fetch para poder probarla
 * contra respuestas guardadas.
 *
 * Ojo: un `EstatusUUID` 201 significa que el SAT **aceptó la solicitud**, no
 * necesariamente que ya canceló: si el comprobante requiere aceptación del
 * receptor, queda "En proceso". Por eso quien llame confirma el estado real con
 * `get_sat_status` en vez de fiarse solo de este código.
 */
export function interpretarCancelacion(respuesta: string): RespuestaCancelacion {
  const estatusUuid = extract(respuesta, "EstatusUUID");
  const estatusCancelacion = extract(respuesta, "EstatusCancelacion");
  const acuse = extract(respuesta, "Acuse");
  const codEstatus = extract(respuesta, "CodEstatus");

  const fault = extract(respuesta, "faultstring");
  const errorGeneral = extract(respuesta, "error");

  // Sin folio y con fault/errores → la operación no se procesó.
  if (!estatusUuid && (fault || errorGeneral)) {
    return {
      ok: false,
      estatusUuid: null,
      estatusCancelacion: null,
      acuse,
      fecha: extract(respuesta, "Fecha"),
      codEstatus,
      mensaje: mensajeCancelacion(codEstatus, fault ?? errorGeneral),
    };
  }

  const aceptada = estatusUuid !== null && (CANCELADO_OK.has(estatusUuid) || /en proceso/i.test(estatusCancelacion ?? ""));
  return {
    ok: aceptada,
    estatusUuid,
    estatusCancelacion,
    acuse,
    fecha: extract(respuesta, "Fecha"),
    codEstatus,
    mensaje: aceptada ? null : mensajeCancelacion(estatusUuid ?? codEstatus, extract(respuesta, "error")),
  };
}

/** Clasifica la respuesta de `get_sat_status`. */
export function interpretarEstatusSat(respuesta: string): EstatusSat | { error: string } {
  const error = extract(respuesta, "error") ?? extract(respuesta, "faultstring");
  const estado = extract(respuesta, "Estado");
  if (!estado && error) return { error };
  return {
    estado,
    esCancelable: extract(respuesta, "EsCancelable"),
    estatusCancelacion: extract(respuesta, "EstatusCancelacion"),
    codigoEstatus: extract(respuesta, "CodigoEstatus"),
  };
}

/**
 * Traduce los códigos de rechazo más comunes de la cancelación a algo accionable.
 * Los del SAT ("205", "708") no le dicen nada al operador.
 */
function mensajeCancelacion(codigo: string | null, crudo: string | null): string {
  switch (codigo) {
    case "205":
      return "El SAT no encontró el folio fiscal. Verifica que la factura exista y esté timbrada.";
    case "203":
      return "El RFC que cancela no coincide con el emisor del comprobante.";
    case "708":
    case "702":
      return "El certificado (CSD) con el que se intenta cancelar no es válido o no corresponde al emisor.";
    default:
      return crudo ?? "El SAT rechazó la cancelación sin explicar el motivo.";
  }
}
