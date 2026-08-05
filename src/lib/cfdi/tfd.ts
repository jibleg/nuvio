import "server-only";
import { XMLParser } from "fast-xml-parser";

/**
 * Datos del timbre que la representación impresa necesita, extraídos del XML
 * timbrado que guarda el PAC (`cfdi.factura.xml_response`): los sellos, los
 * certificados y con qué se arma el código bidimensional (QR) del SAT.
 *
 * Se leen del XML —y no de columnas— porque solo existen una vez timbrado y su
 * fuente de verdad es el comprobante mismo. Se usa un parser DOM real
 * (`fast-xml-parser`) en vez de expresiones regulares sobre el texto: es más
 * robusto ante variaciones de formato del PAC (espacios, orden de atributos,
 * prefijos de namespace distintos) sin perder la búsqueda "encuentra el nodo
 * TimbreFiscalDigital sin importar dónde cuelgue" del enfoque original.
 */

export interface DatosTimbre {
  /** Sello digital del comprobante (emisor). */
  selloCfdi: string | null;
  /** Sello digital del SAT. */
  selloSat: string | null;
  /** No. de serie del CSD del SAT que certificó. */
  noCertificadoSat: string | null;
  /** RFC del proveedor autorizado de certificación (PAC). */
  rfcProvCertif: string | null;
  /** Total del comprobante tal como se timbró (para el `tt` del QR). */
  total: number | null;
  /** Cadena original del complemento de certificación (ver `cadenaTimbre`). */
  cadenaOriginal: string | null;
}

const NULOS: DatosTimbre = {
  selloCfdi: null,
  selloSat: null,
  noCertificadoSat: null,
  rfcProvCertif: null,
  total: null,
  cadenaOriginal: null,
};

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "", removeNSPrefix: true });

type Nodo = Record<string, unknown>;

function parsear(xml: string): unknown | null {
  try {
    return parser.parse(xml) as unknown;
  } catch {
    return null;
  }
}

/** Busca recursivamente el primer nodo cuya etiqueta sea `tag` (sin prefijo de namespace). */
function buscarNodo(valor: unknown, tag: string): Nodo | null {
  if (!valor || typeof valor !== "object") return null;
  const obj = valor as Nodo;

  if (tag in obj) {
    const encontrado = Array.isArray(obj[tag]) ? (obj[tag] as unknown[])[0] : obj[tag];
    if (encontrado && typeof encontrado === "object") return encontrado as Nodo;
  }
  for (const hijo of Object.values(obj)) {
    const items = Array.isArray(hijo) ? hijo : [hijo];
    for (const item of items) {
      const resultado = buscarNodo(item, tag);
      if (resultado) return resultado;
    }
  }
  return null;
}

function texto(nodo: Nodo | null, atributo: string): string | null {
  if (!nodo) return null;
  const valor = nodo[atributo];
  return typeof valor === "string" && valor !== "" ? valor : null;
}

/**
 * Cadena original del complemento de certificación digital del SAT, tal como
 * la define el Anexo 20 para el TFD:
 *
 *   ||Version|UUID|FechaTimbrado|RfcProvCertif|SelloCFD|NoCertificadoSAT||
 *
 * Se DERIVA del timbre en vez de leerse de `cfdi.factura.cadena_original`
 * porque esa columna guarda lo que el PAC haya devuelto en
 * `CadenaOriginalSAT`, y Finkok no siempre la manda. El timbre, en cambio,
 * siempre viene en el XML: con él la cadena se reconstruye completa.
 */
export function cadenaTimbre(xml: string | null): string | null {
  if (!xml) return null;
  const doc = parsear(xml);
  const tfd = buscarNodo(doc, "TimbreFiscalDigital");
  if (!tfd) return null;

  const partes = ["Version", "UUID", "FechaTimbrado", "RfcProvCertif", "SelloCFD", "NoCertificadoSAT"].map((a) =>
    texto(tfd, a),
  );
  // Incompleta no sirve: no la verifica nadie y confunde más que un guion.
  if (partes.some((p) => p === null)) return null;
  return `||${partes.join("|")}||`;
}

export function datosTimbre(xml: string | null): DatosTimbre {
  if (!xml) return NULOS;
  const doc = parsear(xml);
  if (!doc) return NULOS;

  const comprobante = buscarNodo(doc, "Comprobante");
  const tfd = buscarNodo(doc, "TimbreFiscalDigital");
  const totalTexto = texto(comprobante, "Total");
  const total = totalTexto != null ? Number(totalTexto) : null;

  return {
    selloCfdi: texto(tfd, "SelloCFD"),
    selloSat: texto(tfd, "SelloSAT"),
    noCertificadoSat: texto(tfd, "NoCertificadoSAT"),
    rfcProvCertif: texto(tfd, "RfcProvCertif"),
    total: total != null && Number.isFinite(total) ? total : null,
    cadenaOriginal: cadenaTimbre(xml),
  };
}

/**
 * URL de verificación del SAT que codifica el QR (Anexo 20).
 *
 *   …/default.aspx?&id=UUID&re=RFCemisor&rr=RFCreceptor&tt=Total&fe=8 del sello
 *
 * `tt` va a 10 enteros y 6 decimales con ceros a la izquierda; `fe` son los
 * últimos 8 caracteres del sello del CFDI, **sin URL-encodear**: el parser
 * del SAT espera los `+`/`/`/`=` de esos 8 caracteres tal cual, literales.
 * Devuelve `null` si falta algún dato imprescindible (un QR incompleto no
 * verifica y confunde).
 */
export function urlQrSat(args: {
  uuid: string | null;
  rfcEmisor: string;
  rfcReceptor: string;
  total: number | null;
  selloCfdi: string | null;
}): string | null {
  const { uuid, rfcEmisor, rfcReceptor, total, selloCfdi } = args;
  if (!uuid || !rfcEmisor || !rfcReceptor || total == null || !selloCfdi) return null;

  const tt = total.toFixed(6).padStart(17, "0");
  const fe = selloCfdi.slice(-8);
  const base = "https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx";
  return `${base}?&id=${uuid}&re=${rfcEmisor}&rr=${rfcReceptor}&tt=${tt}&fe=${fe}`;
}
