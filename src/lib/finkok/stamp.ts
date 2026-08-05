import "server-only";
import type { FinkokCredentials } from "./credenciales";
import { buildStampEnvelope, extract } from "./soap";

/**
 * Timbrado con el PAC Finkok (método `stamp`).
 *
 * `stamp` recibe el comprobante **ya sellado** por nosotros; Finkok no ve la
 * llave privada (decisión del usuario: el CSD no se sube al PAC). El PAC valida
 * contra el SAT, agrega el Timbre Fiscal Digital y devuelve el XML completo.
 *
 * Un timbre se cobra aunque el comprobante venga mal, así que quien llame aquí
 * debe haber validado antes (ver `cfdi/lectura.ts`).
 */

const TIMEOUT_MS = 45000;

/** El comprobante quedó timbrado (o ya lo estaba). */
export interface TimbreOk {
  ok: true;
  /** Folio fiscal (UUID). */
  uuid: string;
  /** Fecha del timbrado que asigna el PAC, `AAAA-MM-DDTHH:MM:SS`. */
  fecha: string;
  /** XML completo, ya con el Timbre Fiscal Digital. */
  xml: string;
  /** Cadena original del complemento de certificación (la del TFD, no la nuestra). */
  cadenaOriginalTimbre: string | null;
  /** Finkok devuelve el UUID existente si el comprobante ya se había timbrado. */
  yaEstabaTimbrado: boolean;
}

export interface TimbreError {
  ok: false;
  /** Código de Finkok/SAT, útil para el registro; al operador se le muestra el mensaje. */
  codigo: string | null;
  mensaje: string;
  /**
   * `true` cuando el PAC contestó con un rechazo llano: sabemos con certeza que
   * NO timbró, así que es seguro descartar el XML sellado y reconstruirlo con
   * los datos actuales en el siguiente intento (ver `timbrar.ts`).
   *
   * `false` en los casos ambiguos, donde hay que conservar el mismo XML para no
   * arriesgar un doble timbrado: el PAC no respondió (timeout/red, no sabemos
   * si sí llegó a timbrar) o respondió "ya estaba timbrado" sin darnos el XML
   * completo (si regeneráramos, perderíamos el vínculo con ese folio existente).
   */
  rechazoCierto: boolean;
}

export type ResultadoTimbre = TimbreOk | TimbreError;

/** 307 = comprobante duplicado: el PAC devuelve el UUID del timbrado original. */
const COD_DUPLICADO = "307";

/**
 * Traduce los errores más comunes del PAC a algo accionable.
 *
 * Los códigos del SAT son crípticos ("CFDI40147") y el operador no puede hacer
 * nada con ellos; cuando reconocemos uno, se explica qué revisar.
 *
 * ⚠️ La explicación NUNCA sustituye al mensaje del PAC, se le suma. Un código
 * puede significar varias cosas y quedarnos solo con nuestra interpretación
 * manda al operador a arreglar lo que no está roto: el 702 se explicaba como un
 * problema del certificado y el PAC en realidad decía "error when validating
 * the reseller and user" —el RFC no estaba dado de alta en la cuenta—, con el
 * CSD perfectamente válido.
 */
function mensajeParaOperador(codigo: string | null, mensaje: string): string {
  const conDetalle = (explicacion: string) =>
    mensaje.trim() ? `${explicacion} (El PAC respondió: “${mensaje.trim()}”.)` : explicacion;

  if (codigo === "702") {
    return conDetalle(
      "El PAC rechazó el timbrado. Suele ser que el RFC que factura no está dado de alta como emisor en tu cuenta del PAC; si ya lo está, revisa que su firma (CSD) sea la vigente.",
    );
  }
  if (codigo === "703") return conDetalle("El RFC que factura no está dado de alta en la cuenta del PAC.");
  if (codigo === "704") {
    return conDetalle("El sello del comprobante no es válido. Revisa que la firma (CSD) sea la vigente.");
  }
  if (codigo === "708") return conDetalle("El RFC que factura no está registrado en el PAC para timbrar.");
  return mensaje;
}

export async function timbrarConFinkok(xml: string, creds: FinkokCredentials): Promise<ResultadoTimbre> {
  let respuesta: string;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${creds.base}/stamp`, {
      method: "POST",
      headers: { "Content-Type": "text/xml; charset=utf-8", SOAPAction: "" },
      body: buildStampEnvelope(creds, xml),
      signal: ctrl.signal,
    });
    respuesta = await res.text();
  } catch (e) {
    const abortado = e instanceof Error && e.name === "AbortError";
    return {
      ok: false,
      codigo: null,
      // Este caso es delicado: el PAC pudo haber timbrado sin que nos enteremos.
      // Reintentar es seguro porque devuelve el mismo UUID con el código 307.
      mensaje: abortado
        ? "El PAC no respondió a tiempo. Vuelve a intentar: si el comprobante ya se timbró, se recupera el mismo folio fiscal."
        : "No se pudo conectar con el PAC. Revisa la conexión y vuelve a intentar.",
      rechazoCierto: false,
    };
  } finally {
    clearTimeout(timer);
  }

  return interpretarRespuesta(respuesta);
}

/**
 * Interpreta la respuesta SOAP del `stamp`.
 *
 * Se separa del `fetch` para poder probarla contra respuestas guardadas sin
 * salir a la red ni gastar timbres.
 */
export function interpretarRespuesta(respuesta: string): ResultadoTimbre {
  const uuid = extract(respuesta, "UUID");
  const xml = extractXmlTimbrado(respuesta);
  const codigo = extract(respuesta, "CodigoError");
  const incidencia = extract(respuesta, "MensajeIncidencia");

  // El duplicado no es un fracaso: el comprobante existe y este es su folio real.
  // Pasa cuando un intento anterior timbró pero no alcanzamos a guardarlo.
  if (uuid && xml) {
    return {
      ok: true,
      uuid,
      fecha: extract(respuesta, "Fecha") ?? "",
      xml,
      cadenaOriginalTimbre: extract(respuesta, "CadenaOriginalSAT") ?? null,
      yaEstabaTimbrado: codigo === COD_DUPLICADO,
    };
  }

  if (codigo === COD_DUPLICADO && uuid) {
    return {
      ok: false,
      codigo,
      mensaje: `El comprobante ya estaba timbrado (folio fiscal ${uuid}), pero el PAC no devolvió el XML.`,
      rechazoCierto: false,
    };
  }

  const fault = extract(respuesta, "faultstring");
  return {
    ok: false,
    codigo,
    mensaje: mensajeParaOperador(codigo, incidencia ?? fault ?? "El PAC rechazó el comprobante sin explicar el motivo."),
    rechazoCierto: true,
  };
}

/**
 * Saca el XML timbrado de la respuesta.
 *
 * No se puede usar el `extract` genérico: el XML viene escapado como entidades y
 * contiene los mismos nombres de etiqueta que el sobre.
 */
function extractXmlTimbrado(respuesta: string): string | null {
  const m = respuesta.match(/<(?:[^>]*:)?xml>([\s\S]*?)<\/(?:[^>]*:)?xml>/i);
  if (!m || !m[1].trim()) return null;
  return desescapar(m[1].trim());
}

function desescapar(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#13;/g, "\r")
    .replace(/&amp;/g, "&");
}
