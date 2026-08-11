import { Document, Page, StyleSheet, Text, View, Image, Link } from "@react-pdf/renderer";
import type { DatosTimbre } from "@/lib/cfdi/tfd";
import { env } from "@/lib/env";
import type { PagoDetalle } from "../types";
import { NUVIO_HORIZONTAL_DATA_URL, NUVIO_ICON_DATA_URL } from "./nuvio-assets";

const BRAND_700 = "#15808d";
const AURORA_500 = "#58ced5";
const INK = "#1a2b2f";
const MUTED = "#6b7a7d";
const LINE = "#dbe4e5";
const SUNRISE = "#b3720a";
const SUNRISE_BG = "#fdf3e0";

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
  filaBloques: { flexDirection: "row", gap: 10 },
  bloqueMitad: { flex: 1 },
  etiqueta: { fontSize: 7, color: MUTED, textTransform: "uppercase", marginBottom: 2 },
  valor: { fontSize: 9, marginBottom: 4 },
  tablaHeader: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#f2f6f6",
    paddingVertical: 5,
    paddingHorizontal: 6,
    fontSize: 7,
    color: MUTED,
    textTransform: "uppercase",
  },
  tablaFila: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  colFolio: { flex: 3 },
  colParcialidad: { flex: 1, textAlign: "center" },
  colImporte: { flex: 1.2, textAlign: "right" },
  totales: { marginTop: 10, alignItems: "flex-end" },
  totalFinal: { fontSize: 11, fontWeight: 700, marginTop: 4, color: BRAND_700 },
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
  avisoPruebaBanda: { backgroundColor: SUNRISE, paddingVertical: 5, paddingHorizontal: 32 },
  avisoPruebaBandaTexto: {
    fontSize: 7.5,
    fontWeight: 700,
    color: "#ffffff",
    textAlign: "center",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  marcaAguaPrueba: {
    position: "absolute",
    top: 340,
    left: 56,
    width: 500,
    fontSize: 72,
    fontWeight: 900,
    color: SUNRISE,
    opacity: 0.15,
    textAlign: "center",
    letterSpacing: 6,
    transform: "rotate(-30deg)",
  },
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
 * header — para que quede como un verdadero pie de página.
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

export function PagoPdfDocument({
  pago,
  timbre,
  qrDataUrl,
  logoDataUrl,
}: {
  pago: PagoDetalle;
  /** `null` = borrador sin timbrar todavía (vista previa); el documento nunca ha sido timbrado. */
  timbre: DatosTimbre | null;
  qrDataUrl: string | null;
  logoDataUrl?: string | null;
}) {
  const esBorrador = !timbre;
  /** Timbrado, pero contra el ambiente de pruebas (sandbox) del PAC: el folio fiscal existe pero no tiene validez fiscal ante el SAT. */
  const esPrueba = !esBorrador && pago.ambienteTimbrado === "sandbox";

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {esPrueba && (
          <Text style={styles.marcaAguaPrueba} fixed>
            PRUEBA
          </Text>
        )}
        <View style={styles.hero}>
          <View style={styles.heroEmisor}>
            <Link src={env.APP_URL} style={styles.heroLogoCarta}>
              <Image style={styles.heroLogo} src={logoDataUrl ?? NUVIO_ICON_DATA_URL} />
            </Link>
            <View>
              <Text style={styles.heroEmisorNombre}>{pago.emisorNombre ?? "—"}</Text>
              <Text style={styles.heroEmisorRfc}>{pago.emisorRfc ?? "—"}</Text>
            </View>
          </View>
          <View style={styles.heroDerecha}>
            <Text style={styles.heroTitulo}>
              {esBorrador
                ? "COMPLEMENTO DE PAGO · BORRADOR"
                : esPrueba
                  ? "COMPLEMENTO DE PAGO · CFDI 4.0 · PRUEBA"
                  : "COMPLEMENTO DE PAGO · CFDI 4.0"}
            </Text>
            {esBorrador ? (
              <Text style={styles.heroFolio}>Vista previa — sin folio fiscal</Text>
            ) : (
              <>
                <Text style={styles.heroFolio}>{pago.folioFiscal}</Text>
                <Text style={styles.heroSerieFolio}>
                  Serie {pago.serie ?? "—"} · Folio {pago.folio ?? "—"}
                </Text>
                <Text style={styles.heroSerieFolio}>{pago.fechaTimbrado ?? ""}</Text>
              </>
            )}
          </View>
        </View>
        <View style={styles.heroAcento} />
        {esPrueba && (
          <View style={styles.avisoPruebaBanda}>
            <Text style={styles.avisoPruebaBandaTexto}>
              Documento de prueba — timbrado en ambiente sandbox, sin validez fiscal ante el SAT
            </Text>
          </View>
        )}

        <View style={styles.body}>
          <View style={styles.filaBloques}>
            <View style={[styles.bloque, styles.bloqueMitad]}>
              <Text style={styles.etiqueta}>Receptor</Text>
              <Text style={styles.valor}>{pago.receptorNombre}</Text>
              <Text style={styles.valor}>{pago.receptorRfc}</Text>
            </View>
            <View style={[styles.bloque, styles.bloqueMitad]}>
              <Text style={styles.etiqueta}>Datos del pago</Text>
              <Text style={styles.valor}>Fecha: {pago.fechaPago ?? "—"}</Text>
              <Text style={styles.valor}>Referencia: {pago.numeroOperacion || "—"}</Text>
            </View>
          </View>

          <View style={styles.tablaHeader}>
            <Text style={styles.colFolio}>Folio fiscal del CFDI pagado</Text>
            <Text style={styles.colParcialidad}>Parc.</Text>
            <Text style={styles.colImporte}>Saldo ant.</Text>
            <Text style={styles.colImporte}>Pagado</Text>
            <Text style={styles.colImporte}>Insoluto</Text>
          </View>
          {pago.documentosDetalle.map((d, i) => (
            <View key={i} style={styles.tablaFila}>
              <View style={styles.colFolio}>
                <Text style={{ fontSize: 7 }}>{d.folioFiscal ?? "—"}</Text>
                <Text style={{ fontSize: 6, color: MUTED }}>{d.serieFolio}</Text>
              </View>
              <Text style={styles.colParcialidad}>{d.parcialidad ?? "1"}</Text>
              <Text style={styles.colImporte}>{formatoMoneda.format(d.impSaldoAnt)}</Text>
              <Text style={styles.colImporte}>{formatoMoneda.format(d.impPagado)}</Text>
              <Text style={styles.colImporte}>{formatoMoneda.format(d.impSaldoInsoluto)}</Text>
            </View>
          ))}

          <View style={styles.totales}>
            <Text style={styles.totalFinal}>Total pagado {formatoMoneda.format(pago.monto ? Number(pago.monto) : 0)}</Text>
          </View>

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
                      <Text style={styles.timbreDatoValor}>{pago.folioFiscal}</Text>
                    </View>
                    <View>
                      <Text style={styles.timbreDatoEtiqueta}>Fecha y hora de certificación</Text>
                      <Text style={styles.timbreDatoValor}>{pago.fechaTimbrado ?? "—"}</Text>
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
            {esBorrador ? "" : "Este documento es una representación impresa de un CFDI de tipo Pago (complemento Pagos 2.0) · "}
            Fecha de impresión: {fechaImpresion()}
          </Text>
        </View>

        <PromoFooterNuvio />
      </Page>
    </Document>
  );
}
