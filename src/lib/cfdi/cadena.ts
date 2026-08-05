import "server-only";
import { Xslt, XmlParser } from "xslt-processor";
import { XSLT_CADENA_ORIGINAL_40 } from "./xslt-cadena-original";

/**
 * Cadena original del CFDI 4.0: la secuencia de datos del comprobante que se
 * firma para producir el sello. La genera la hoja XSLT oficial del SAT, no una
 * reimplementación nuestra (ver `xslt-cadena-original.ts`).
 */

/**
 * Timbre Fiscal Digital que el PAC agrega al comprobante. Es un nodo vacío
 * (autocerrado); el prefijo suele ser `tfd:` pero se acepta cualquiera.
 */
const TIMBRE = /<[A-Za-z0-9]+:TimbreFiscalDigital\b[\s\S]*?\/>/g;

/**
 * Quita SOLO el Timbre Fiscal Digital del XML, conservando cualquier otro
 * complemento (p. ej. `pago20:Pagos`).
 *
 * El sello del emisor se calcula sobre el comprobante **antes** de que el PAC le
 * agregue el timbre, pero DESPUÉS de sus propios complementos: el sello de un
 * CFDI de pago sí cubre `pago20:Pagos`. Por eso no se puede borrar el
 * `<cfdi:Complemento>` entero (se perdería el pago); solo el TFD, que es lo que
 * el PAC añade después y no debe entrar en la cadena. En un comprobante de
 * ingreso, cuyo único complemento es el TFD, esto equivale a lo de siempre.
 */
export function sinComplemento(xml: string): string {
  return xml.replace(TIMBRE, "");
}

/**
 * Transforma el XML del comprobante en su cadena original.
 *
 * Si el XML trae complemento se ignora: la cadena que se firma nunca lo incluye.
 */
export async function cadenaOriginal(xml: string): Promise<string> {
  const xslt = new Xslt();
  const parser = new XmlParser();
  const cadena = await xslt.xsltProcess(
    parser.xmlParse(sinComplemento(xml)),
    parser.xmlParse(XSLT_CADENA_ORIGINAL_40),
  );

  // Una cadena válida siempre abre y cierra con los separadores del SAT. Si el
  // XSLT no encontró el comprobante devolvería algo vacío o a medias, y firmar
  // eso produciría un CFDI que el SAT rechaza sin explicar por qué.
  if (!cadena.startsWith("||") || !cadena.endsWith("||")) {
    throw new Error("La cadena original no tiene la forma que exige el SAT; el XML del comprobante es inválido.");
  }
  return cadena;
}
