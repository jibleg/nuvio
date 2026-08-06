import { Document, Page, StyleSheet, Text, View, Image } from "@react-pdf/renderer";
import type { DatosTimbre } from "@/lib/cfdi/tfd";
import type { PagoDetalle } from "../types";

const BRAND_700 = "#15808d";
const AURORA_500 = "#58ced5";
const INK = "#1a2b2f";
const MUTED = "#6b7a7d";
const LINE = "#dbe4e5";

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
  heroLogo: { width: 36, height: 36, borderRadius: 4, objectFit: "contain", backgroundColor: "#ffffff" },
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
    backgroundColor: "#f2f6f6",
    paddingVertical: 5,
    paddingHorizontal: 6,
    fontSize: 7,
    color: MUTED,
    textTransform: "uppercase",
  },
  tablaFila: {
    flexDirection: "row",
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
  pie: { marginTop: 20, flexDirection: "row", gap: 12, alignItems: "flex-start" },
  qr: { width: 70, height: 70 },
  selloTexto: { fontSize: 6, color: MUTED, flex: 1 },
  footerNuvio: {
    marginTop: 24,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: LINE,
    textAlign: "center",
    fontSize: 6.5,
    color: MUTED,
  },
});

const formatoMoneda = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

export function PagoPdfDocument({
  pago,
  timbre,
  qrDataUrl,
  logoDataUrl,
}: {
  pago: PagoDetalle;
  timbre: DatosTimbre;
  qrDataUrl: string | null;
  logoDataUrl?: string | null;
}) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.hero}>
          <View style={styles.heroEmisor}>
            {logoDataUrl && <Image style={styles.heroLogo} src={logoDataUrl} />}
            <View>
              <Text style={styles.heroEmisorNombre}>{pago.emisorNombre ?? "—"}</Text>
              <Text style={styles.heroEmisorRfc}>{pago.emisorRfc ?? "—"}</Text>
            </View>
          </View>
          <View style={styles.heroDerecha}>
            <Text style={styles.heroTitulo}>COMPLEMENTO DE PAGO · CFDI 4.0</Text>
            <Text style={styles.heroFolio}>{pago.folioFiscal}</Text>
            <Text style={styles.heroSerieFolio}>
              Serie {pago.serie ?? "—"} · Folio {pago.folio ?? "—"}
            </Text>
            <Text style={styles.heroSerieFolio}>{pago.fechaTimbrado ?? ""}</Text>
          </View>
        </View>
        <View style={styles.heroAcento} />

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

          <View style={styles.pie}>
            {qrDataUrl && <Image style={styles.qr} src={qrDataUrl} />}
            <Text style={styles.selloTexto}>
              UUID: {pago.folioFiscal}
              {"\n"}Sello CFDI: {timbre.selloCfdi ?? "—"}
              {"\n"}Sello SAT: {timbre.selloSat ?? "—"}
              {"\n"}No. Certificado SAT: {timbre.noCertificadoSat ?? "—"}
              {"\n"}Este documento es una representación impresa de un CFDI de tipo Pago (complemento Pagos 2.0).
            </Text>
          </View>

          <Text style={styles.footerNuvio}>Facturado con Nuvio · el SaaS que te devuelve tiempo para crecer · nuvio.mx</Text>
        </View>
      </Page>
    </Document>
  );
}
