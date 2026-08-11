import { Document, Page, StyleSheet, Text, View, Image, Link } from "@react-pdf/renderer";
import type { DatosTimbre } from "@/lib/cfdi/tfd";
import { env } from "@/lib/env";
import { cantidadEnLetras } from "@/lib/cfdi/numero-a-letras";
import type { FacturaDetalle } from "../types";
import { NUVIO_HORIZONTAL_DATA_URL, NUVIO_ICON_DATA_URL } from "./nuvio-assets";

const BRAND_700 = "#15808d";
const AURORA_500 = "#58ced5";
const INK = "#1a2b2f";
const MUTED = "#6b7a7d";
const LINE = "#dbe4e5";
const SUNRISE = "#b3720a";
const SUNRISE_BG = "#fdf3e0";

/** Etiquetas legibles (clave + descripción SAT) y domicilios que exige la representación impresa — resueltas en `armar-pdf-factura.tsx`, el documento solo las pinta. */
export type DatosFiscalesPdf = {
  regimenEmisor: string;
  regimenReceptor: string;
  uso: string;
  formaPago: string;
  metodoPago: string;
  moneda: string;
  /** CP del lugar de expedición (domicilio del emisor), `null` si no se pudo resolver. */
  lugarExpedicion: string | null;
  /** CP del domicilio fiscal del receptor. */
  domicilioReceptor: string | null;
};

const styles = StyleSheet.create({
  page: { fontSize: 9, color: INK, fontFamily: "Helvetica" },
  hero: {
    backgroundColor: BRAND_700,
    paddingHorizontal: 32,
    paddingTop: 26,
    paddingBottom: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heroAcento: { height: 4, backgroundColor: AURORA_500 },
  heroEmisor: { flexDirection: "row", alignItems: "center", gap: 10, maxWidth: 300 },
  heroLogoCarta: { backgroundColor: "#ffffff", borderRadius: 10, padding: 5 },
  heroLogo: { width: 30, height: 30, borderRadius: 6, objectFit: "contain" },
  heroEmisorNombre: { fontSize: 13, fontWeight: 700, color: "#ffffff" },
  heroEmisorRfc: { fontSize: 8, color: "#e3f7f8", marginTop: 1 },
  heroDerecha: { alignItems: "flex-end" },
  heroTitulo: { fontSize: 11, fontWeight: 700, color: "#ffffff", letterSpacing: 0.5 },
  heroFolio: { fontSize: 7, color: "#e3f7f8", marginTop: 3, maxWidth: 220, textAlign: "right" },
  heroSerieFolio: { fontSize: 7, color: "#e3f7f8", marginTop: 2 },
  body: { padding: 32, paddingTop: 20 },
  bloque: { borderWidth: 1, borderColor: LINE, borderRadius: 6, padding: 10, marginBottom: 10 },
  filaBloques: { flexDirection: "row", gap: 10, alignItems: "stretch" },
  bloqueMitad: { flex: 1 },
  etiqueta: { fontSize: 7, color: MUTED, textTransform: "uppercase", marginBottom: 2 },
  valor: { fontSize: 9, marginBottom: 4 },
  filaDato: { marginBottom: 5 },
  filaDatoEtiqueta: { fontSize: 6.5, color: MUTED, textTransform: "uppercase" },
  filaDatoValor: { fontSize: 8, color: INK, marginTop: 1 },
  comprobanteInfo: {
    flexDirection: "row",
    backgroundColor: "#f2f6f6",
    borderRadius: 6,
    marginBottom: 10,
  },
  comprobanteCol: { flex: 1, paddingVertical: 8, paddingHorizontal: 10 },
  tablaHeader: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#f2f6f6",
    paddingVertical: 5,
    paddingHorizontal: 6,
    fontSize: 6.5,
    color: MUTED,
    textTransform: "uppercase",
  },
  tablaFila: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
    fontSize: 8,
  },
  colDescripcion: { flex: 2.2 },
  colClave: { flex: 0.9 },
  colUnidad: { flex: 0.8 },
  colCantidad: { flex: 0.6, textAlign: "right" },
  colPrecio: { flex: 1, textAlign: "right" },
  colImporte: { flex: 1, textAlign: "right" },
  colIva: { flex: 0.9, textAlign: "right" },
  filaTotales: { marginTop: 12, flexDirection: "row", gap: 16, alignItems: "flex-start" },
  letrasCol: { flex: 1 },
  letrasEtiqueta: { fontSize: 6.5, color: MUTED, textTransform: "uppercase" },
  letrasValor: { fontSize: 8, color: BRAND_700, fontWeight: 700, marginTop: 2 },
  totales: { alignItems: "flex-end" },
  totalLinea: { flexDirection: "row", gap: 16, marginBottom: 2 },
  totalEtiqueta: { color: MUTED },
  totalFinal: { fontSize: 11, fontWeight: 700, marginTop: 4, color: BRAND_700 },
  relacionadoBloque: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 6,
    padding: 10,
  },
  timbreCard: {
    marginTop: 18,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 8,
    overflow: "hidden",
  },
  timbreTitulo: {
    backgroundColor: "#f2f6f6",
    color: BRAND_700,
    fontSize: 8,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  timbreCuerpo: { padding: 10 },
  timbreFilaSuperior: { flexDirection: "row", gap: 12 },
  qr: { width: 66, height: 66 },
  timbreDatos: { flex: 1, gap: 4 },
  timbreDatoEtiqueta: { fontSize: 6, color: MUTED, textTransform: "uppercase" },
  timbreDatoValor: { fontSize: 7, color: INK, marginTop: 0.5 },
  cadenaEtiqueta: { fontSize: 6, color: MUTED, textTransform: "uppercase", marginTop: 8 },
  cadenaValor: { fontSize: 5.5, color: MUTED, marginTop: 2, lineHeight: 1.5, fontFamily: "Courier" },
  leyenda: { marginTop: 10, fontSize: 6.5, color: MUTED, textAlign: "center" },
  avisoBorrador: {
    flex: 1,
    borderWidth: 1,
    borderColor: SUNRISE,
    backgroundColor: SUNRISE_BG,
    borderRadius: 6,
    padding: 10,
  },
  avisoBorradorTexto: { fontSize: 7.5, color: SUNRISE, fontWeight: 700, textAlign: "center" },
  promoAcento: { height: 4, backgroundColor: AURORA_500 },
  promoHero: {
    backgroundColor: BRAND_700,
    paddingHorizontal: 32,
    paddingVertical: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  promoTextos: { flex: 1 },
  promoTitulo: { fontSize: 10, fontWeight: 700, color: "#ffffff" },
  promoCuerpo: { fontSize: 7.5, color: "#e3f7f8", marginTop: 3, lineHeight: 1.4 },
  promoCta: { fontSize: 7, fontWeight: 700, color: "#ffffff", marginTop: 6, letterSpacing: 0.3 },
  promoLogoCarta: { backgroundColor: "#ffffff", borderRadius: 10, padding: 8, flexShrink: 0 },
  promoLogo: { width: 76, height: 26, borderRadius: 4, objectFit: "contain" },
});

const formatoMoneda = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

const TIPO_RELACION_LABEL: Record<string, string> = {
  "04": "04 - Sustitución de los CFDI previos",
};

/** Vista previa de borrador (sin timbrar): reemplaza el QR/sello por un aviso claro de que el documento no tiene validez fiscal. */
function AvisoBorrador({ texto }: { texto: string }) {
  return (
    <View style={styles.avisoBorrador}>
      <Text style={styles.avisoBorradorTexto}>{texto}</Text>
    </View>
  );
}

/**
 * Banner promocional de Nuvio: el receptor del CFDI también lo ve, así que
 * cada documento es un canal de adquisición (decisión del usuario). Va FUERA
 * del `body` con padding, a todo el ancho de la hoja — igual que el hero del
 * header — para que quede como un verdadero pie de página, no una tarjeta
 * flotando dentro del margen del contenido.
 */
function PromoFooterNuvio() {
  return (
    <>
      <View style={styles.promoAcento} />
      <View style={styles.promoHero}>
        <View style={styles.promoTextos}>
          <Text style={styles.promoTitulo}>¿Administras un negocio? Conoce Nuvio.</Text>
          <Text style={styles.promoCuerpo}>
            Punto de venta, inventario, facturación CFDI 4.0 y contabilidad en una sola plataforma — rápida de
            implementar y fácil de usar, para dedicar menos tiempo a la administración y más a crecer.
          </Text>
          <Text style={styles.promoCta}>nuvio.mx</Text>
        </View>
        <Link src={env.APP_URL} style={styles.promoLogoCarta}>
          <Image style={styles.promoLogo} src={NUVIO_HORIZONTAL_DATA_URL} />
        </Link>
      </View>
    </>
  );
}

const fechaImpresion = () =>
  new Date().toLocaleString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export function FacturaPdfDocument({
  factura,
  timbre,
  qrDataUrl,
  logoDataUrl,
  datosFiscales,
}: {
  factura: FacturaDetalle;
  /** `null` = borrador sin timbrar todavía (vista previa); el documento nunca ha sido timbrado. */
  timbre: DatosTimbre | null;
  qrDataUrl: string | null;
  logoDataUrl?: string | null;
  datosFiscales: DatosFiscalesPdf;
}) {
  const esBorrador = !timbre;
  const subtotal = factura.conceptos.reduce((acc, c) => acc + c.importe, 0);
  const gravado = factura.conceptos.filter((c) => c.gravado).reduce((acc, c) => acc + c.importe, 0);
  const exento = subtotal - gravado;
  const iva = Math.round(gravado * 0.16 * 100) / 100;
  const total = subtotal + iva;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.hero}>
          <View style={styles.heroEmisor}>
            <Link src={env.APP_URL} style={styles.heroLogoCarta}>
              <Image style={styles.heroLogo} src={logoDataUrl ?? NUVIO_ICON_DATA_URL} />
            </Link>
            <View>
              <Text style={styles.heroEmisorNombre}>{factura.emisorNombre ?? "—"}</Text>
              <Text style={styles.heroEmisorRfc}>{factura.emisorRfc ?? "—"}</Text>
            </View>
          </View>
          <View style={styles.heroDerecha}>
            <Text style={styles.heroTitulo}>{esBorrador ? "FACTURA · BORRADOR" : "FACTURA · CFDI 4.0"}</Text>
            {esBorrador ? (
              <Text style={styles.heroFolio}>Vista previa — sin folio fiscal</Text>
            ) : (
              <>
                <Text style={styles.heroFolio}>{factura.folioFiscal}</Text>
                <Text style={styles.heroSerieFolio}>
                  Serie {factura.serie ?? "—"} · Folio {factura.folio ?? "—"}
                </Text>
                <Text style={styles.heroSerieFolio}>{factura.fechaTimbrado ?? ""}</Text>
              </>
            )}
          </View>
        </View>
        <View style={styles.heroAcento} />

        <View style={styles.body}>
          <View style={styles.filaBloques}>
            <View style={[styles.bloque, styles.bloqueMitad]}>
              <Text style={styles.etiqueta}>Emisor</Text>
              <Text style={styles.valor}>{factura.emisorNombre ?? "—"}</Text>
              <Text style={styles.valor}>{factura.emisorRfc ?? "—"}</Text>
              <View style={styles.filaDato}>
                <Text style={styles.filaDatoEtiqueta}>Régimen fiscal</Text>
                <Text style={styles.filaDatoValor}>{datosFiscales.regimenEmisor}</Text>
              </View>
              <View style={styles.filaDato}>
                <Text style={styles.filaDatoEtiqueta}>Lugar de expedición (C.P.)</Text>
                <Text style={styles.filaDatoValor}>{datosFiscales.lugarExpedicion ?? "—"}</Text>
              </View>
            </View>
            <View style={[styles.bloque, styles.bloqueMitad]}>
              <Text style={styles.etiqueta}>Receptor</Text>
              <Text style={styles.valor}>{factura.receptorNombre ?? "—"}</Text>
              <Text style={styles.valor}>{factura.receptorRfc ?? "—"}</Text>
              <View style={styles.filaDato}>
                <Text style={styles.filaDatoEtiqueta}>Uso de CFDI</Text>
                <Text style={styles.filaDatoValor}>{datosFiscales.uso}</Text>
              </View>
              <View style={styles.filaDato}>
                <Text style={styles.filaDatoEtiqueta}>Régimen fiscal</Text>
                <Text style={styles.filaDatoValor}>{datosFiscales.regimenReceptor}</Text>
              </View>
              <View style={styles.filaDato}>
                <Text style={styles.filaDatoEtiqueta}>Domicilio fiscal (C.P.)</Text>
                <Text style={styles.filaDatoValor}>{datosFiscales.domicilioReceptor ?? "—"}</Text>
              </View>
            </View>
          </View>

          <View style={styles.comprobanteInfo}>
            <View style={styles.comprobanteCol}>
              <Text style={styles.filaDatoEtiqueta}>Forma de pago</Text>
              <Text style={styles.filaDatoValor}>{datosFiscales.formaPago}</Text>
            </View>
            <View style={styles.comprobanteCol}>
              <Text style={styles.filaDatoEtiqueta}>Método de pago</Text>
              <Text style={styles.filaDatoValor}>{datosFiscales.metodoPago}</Text>
            </View>
            <View style={styles.comprobanteCol}>
              <Text style={styles.filaDatoEtiqueta}>Moneda</Text>
              <Text style={styles.filaDatoValor}>{datosFiscales.moneda}</Text>
            </View>
          </View>

          <View style={styles.tablaHeader}>
            <Text style={styles.colDescripcion}>Descripción</Text>
            <Text style={styles.colClave}>Clave</Text>
            <Text style={styles.colUnidad}>Unidad</Text>
            <Text style={styles.colCantidad}>Cant.</Text>
            <Text style={styles.colPrecio}>P. unitario</Text>
            <Text style={styles.colImporte}>Importe</Text>
            <Text style={styles.colIva}>IVA</Text>
          </View>
          {factura.conceptos.map((c, i) => {
            const ivaConcepto = c.gravado ? Math.round(c.importe * 0.16 * 100) / 100 : null;
            return (
              <View key={i} style={styles.tablaFila}>
                <Text style={styles.colDescripcion}>{c.descripcion}</Text>
                <Text style={styles.colClave}>{c.claveProdServ}</Text>
                <Text style={styles.colUnidad}>{c.claveUnidad}</Text>
                <Text style={styles.colCantidad}>{c.cantidad}</Text>
                <Text style={styles.colPrecio}>{formatoMoneda.format(c.valorUnitario)}</Text>
                <Text style={styles.colImporte}>{formatoMoneda.format(c.importe)}</Text>
                <Text style={styles.colIva}>{ivaConcepto !== null ? formatoMoneda.format(ivaConcepto) : "Exento"}</Text>
              </View>
            );
          })}

          <View style={styles.filaTotales}>
            <View style={styles.letrasCol}>
              <Text style={styles.letrasEtiqueta}>Cantidad con letras</Text>
              <Text style={styles.letrasValor}>{cantidadEnLetras(total)}</Text>
            </View>
            <View style={styles.totales}>
              <View style={styles.totalLinea}>
                <Text style={styles.totalEtiqueta}>Subtotal</Text>
                <Text>{formatoMoneda.format(subtotal)}</Text>
              </View>
              {exento > 0 && (
                <View style={styles.totalLinea}>
                  <Text style={styles.totalEtiqueta}>Importe exento</Text>
                  <Text>{formatoMoneda.format(exento)}</Text>
                </View>
              )}
              <View style={styles.totalLinea}>
                <Text style={styles.totalEtiqueta}>IVA 16%</Text>
                <Text>{formatoMoneda.format(iva)}</Text>
              </View>
              <Text style={styles.totalFinal}>Total {formatoMoneda.format(total)}</Text>
            </View>
          </View>

          {factura.cfdiRelacionado && (
            <View style={styles.relacionadoBloque}>
              <Text style={styles.etiqueta}>CFDI relacionado</Text>
              <View style={styles.filaDato}>
                <Text style={styles.filaDatoEtiqueta}>Tipo de relación</Text>
                <Text style={styles.filaDatoValor}>
                  {(factura.tipoRelacion && TIPO_RELACION_LABEL[factura.tipoRelacion]) ?? factura.tipoRelacion ?? "—"}
                </Text>
              </View>
              <View style={styles.filaDato}>
                <Text style={styles.filaDatoEtiqueta}>Folio fiscal</Text>
                <Text style={styles.filaDatoValor}>{factura.cfdiRelacionado}</Text>
              </View>
            </View>
          )}

          {esBorrador ? (
            <View style={{ marginTop: 18 }}>
              <AvisoBorrador texto="BORRADOR — vista previa sin validez fiscal. Este documento aún no ha sido timbrado ante el SAT." />
            </View>
          ) : (
            <View style={styles.timbreCard}>
              <Text style={styles.timbreTitulo}>Información del timbre fiscal</Text>
              <View style={styles.timbreCuerpo}>
                <View style={styles.timbreFilaSuperior}>
                  {qrDataUrl && <Image style={styles.qr} src={qrDataUrl} />}
                  <View style={styles.timbreDatos}>
                    <View>
                      <Text style={styles.timbreDatoEtiqueta}>Folio fiscal (UUID)</Text>
                      <Text style={styles.timbreDatoValor}>{factura.folioFiscal}</Text>
                    </View>
                    <View>
                      <Text style={styles.timbreDatoEtiqueta}>Fecha y hora de certificación</Text>
                      <Text style={styles.timbreDatoValor}>{factura.fechaTimbrado ?? "—"}</Text>
                    </View>
                    <View>
                      <Text style={styles.timbreDatoEtiqueta}>RFC del proveedor de certificación</Text>
                      <Text style={styles.timbreDatoValor}>{timbre.rfcProvCertif ?? "—"}</Text>
                    </View>
                    <View>
                      <Text style={styles.timbreDatoEtiqueta}>No. de serie del certificado del SAT</Text>
                      <Text style={styles.timbreDatoValor}>{timbre.noCertificadoSat ?? "—"}</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.cadenaEtiqueta}>Cadena original del complemento de certificación digital del SAT</Text>
                <Text style={styles.cadenaValor}>{timbre.cadenaOriginal ?? "—"}</Text>

                <Text style={styles.cadenaEtiqueta}>Sello del comprobante fiscal digital</Text>
                <Text style={styles.cadenaValor}>{timbre.selloCfdi ?? "—"}</Text>

                <Text style={styles.cadenaEtiqueta}>Sello digital del SAT</Text>
                <Text style={styles.cadenaValor}>{timbre.selloSat ?? "—"}</Text>
              </View>
            </View>
          )}

          <Text style={styles.leyenda}>
            {esBorrador ? "" : "Este documento es una representación impresa de un CFDI 4.0 · "}
            Fecha de impresión: {fechaImpresion()}
          </Text>
        </View>

        <PromoFooterNuvio />
      </Page>
    </Document>
  );
}
