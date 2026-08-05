import "server-only";
import type { FinkokCredentials } from "./credenciales";

/**
 * Helpers SOAP del PAC Finkok: construcción del sobre de timbrado y clasificación
 * de la respuesta. Se separan de `client.ts` para que el orquestador (fetch +
 * timeout) quede legible y estas piezas puras sean verificables de forma aislada.
 */

export type FinkokTestResult =
  | { ok: true; message: string }
  | { ok: false; kind: "credenciales" | "red" | "respuesta"; message: string };

/**
 * Sobre SOAP del método `stamp`, que recibe el XML ya sellado por nosotros.
 *
 * Lo comparten el timbrado real y la prueba de conexión: la prueba manda un XML
 * inválido a propósito porque Finkok autentica antes de validarlo, así que
 * comprueba las credenciales sin consumir un timbre.
 */
export function buildStampEnvelope(creds: FinkokCredentials, xml?: string): string {
  const xmlB64 = Buffer.from(xml ?? "<x/>", "utf8").toString("base64");
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:apps="http://facturacion.finkok.com/stamp">
  <soapenv:Header/>
  <soapenv:Body>
    <apps:stamp>
      <apps:xml>${xmlB64}</apps:xml>
      <apps:username>${escapeXml(creds.usuario)}</apps:username>
      <apps:password>${escapeXml(creds.password)}</apps:password>
    </apps:stamp>
  </soapenv:Body>
</soapenv:Envelope>`;
}

/**
 * Clasifica el cuerpo de la respuesta SOAP de Finkok en un `FinkokTestResult`:
 *  - CodigoError 300 (o "usuario o contraseña") → credenciales inválidas.
 *  - contiene `stampResponse` → autenticación correcta (el XML de prueba se
 *    rechaza después, sin gastar timbre).
 *  - en otro caso → devuelve el `faultstring` como respuesta inesperada.
 */
export function parseFinkokResponse(text: string, creds: FinkokCredentials): FinkokTestResult {
  const codigo = extract(text, "CodigoError");
  const mensaje = extract(text, "MensajeIncidencia");

  // 300 = usuario/contraseña inválidos.
  if (codigo === "300" || /usuario o contrase/i.test(mensaje ?? "")) {
    return { ok: false, kind: "credenciales", message: "Usuario o contraseña de Finkok inválidos." };
  }

  if (text.includes("stampResponse")) {
    const amb = creds.ambiente === "produccion" ? "Producción" : "Sandbox";
    return { ok: true, message: `Conexión y credenciales correctas (${amb}).` };
  }

  // Fault SOAP u otra cosa.
  const fault = extract(text, "faultstring");
  return {
    ok: false,
    kind: "respuesta",
    message: fault ?? "Respuesta inesperada de Finkok.",
  };
}

export function extract(xml: string, tag: string): string | null {
  // Captura <...:tag>valor</...:tag> ignorando prefijos de namespace.
  const m = xml.match(new RegExp(`<[^>]*:?${tag}>([^<]*)</[^>]*:?${tag}>`, "i"));
  return m ? m[1].trim() : null;
}

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
