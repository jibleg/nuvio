import { Document, Page, StyleSheet, Text, View, Image } from "@react-pdf/renderer";
import type { DatosTimbre } from "@/lib/cfdi/tfd";
import type { FacturaDetalle } from "../types";

const BRAND = "#15808d";
const INK = "#1a2b2f";
const MUTED = "#6b7a7d";
const LINE = "#dbe4e5";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, color: INK, fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  marca: { fontSize: 16, fontWeight: 700, color: BRAND },
  tituloFolio: { textAlign: "right" },
  titulo: { fontSize: 12, fontWeight: 700 },
  folioFiscal: { fontSize: 7, color: MUTED, marginTop: 2 },
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
  colDescripcion: { flex: 3 },
  colCantidad: { flex: 1, textAlign: "right" },
  colPrecio: { flex: 1, textAlign: "right" },
  colImporte: { flex: 1, textAlign: "right" },
  totales: { marginTop: 10, alignItems: "flex-end" },
  totalLinea: { flexDirection: "row", gap: 16, marginBottom: 2 },
  totalEtiqueta: { color: MUTED },
  totalFinal: { fontSize: 11, fontWeight: 700, marginTop: 4 },
  pie: { marginTop: 20, flexDirection: "row", gap: 12, alignItems: "flex-start" },
  qr: { width: 70, height: 70 },
  selloTexto: { fontSize: 6, color: MUTED, flex: 1 },
});

const formatoMoneda = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

export function FacturaPdfDocument({
  factura,
  timbre,
  qrDataUrl,
}: {
  factura: FacturaDetalle;
  timbre: DatosTimbre;
  qrDataUrl: string | null;
}) {
  const subtotal = factura.conceptos.reduce((acc, c) => acc + c.importe, 0);
  const iva = factura.conceptos.filter((c) => c.gravado).reduce((acc, c) => acc + Math.round(c.importe * 0.16 * 100) / 100, 0);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.marca}>Nuvio</Text>
            <Text style={{ fontSize: 8, color: MUTED }}>{factura.emisorNombre}</Text>
            <Text style={{ fontSize: 8, color: MUTED }}>{factura.emisorRfc}</Text>
          </View>
          <View style={styles.tituloFolio}>
            <Text style={styles.titulo}>FACTURA — CFDI 4.0</Text>
            <Text style={styles.folioFiscal}>{factura.folioFiscal}</Text>
            <Text style={{ fontSize: 7, color: MUTED, marginTop: 2 }}>
              Serie {factura.serie ?? "—"} · Folio {factura.folio ?? "—"}
            </Text>
            <Text style={{ fontSize: 7, color: MUTED }}>{factura.fechaTimbrado ?? ""}</Text>
          </View>
        </View>

        <View style={styles.filaBloques}>
          <View style={[styles.bloque, styles.bloqueMitad]}>
            <Text style={styles.etiqueta}>Receptor</Text>
            <Text style={styles.valor}>{factura.receptorNombre}</Text>
            <Text style={styles.valor}>{factura.receptorRfc}</Text>
          </View>
          <View style={[styles.bloque, styles.bloqueMitad]}>
            <Text style={styles.etiqueta}>Comprobante</Text>
            <Text style={styles.valor}>Moneda: {"MXN"}</Text>
          </View>
        </View>

        <View style={styles.tablaHeader}>
          <Text style={styles.colDescripcion}>Descripción</Text>
          <Text style={styles.colCantidad}>Cant.</Text>
          <Text style={styles.colPrecio}>P. unitario</Text>
          <Text style={styles.colImporte}>Importe</Text>
        </View>
        {factura.conceptos.map((c, i) => (
          <View key={i} style={styles.tablaFila}>
            <View style={styles.colDescripcion}>
              <Text>{c.descripcion}</Text>
              <Text style={{ fontSize: 6, color: MUTED }}>
                {c.claveProdServ} · {c.claveUnidad}
              </Text>
            </View>
            <Text style={styles.colCantidad}>{c.cantidad}</Text>
            <Text style={styles.colPrecio}>{formatoMoneda.format(c.valorUnitario)}</Text>
            <Text style={styles.colImporte}>{formatoMoneda.format(c.importe)}</Text>
          </View>
        ))}

        <View style={styles.totales}>
          <View style={styles.totalLinea}>
            <Text style={styles.totalEtiqueta}>Subtotal</Text>
            <Text>{formatoMoneda.format(subtotal)}</Text>
          </View>
          <View style={styles.totalLinea}>
            <Text style={styles.totalEtiqueta}>IVA</Text>
            <Text>{formatoMoneda.format(iva)}</Text>
          </View>
          <Text style={styles.totalFinal}>Total {formatoMoneda.format(subtotal + iva)}</Text>
        </View>

        <View style={styles.pie}>
          {qrDataUrl && <Image style={styles.qr} src={qrDataUrl} />}
          <Text style={styles.selloTexto}>
            UUID: {factura.folioFiscal}
            {"\n"}Sello CFDI: {timbre.selloCfdi ?? "—"}
            {"\n"}Sello SAT: {timbre.selloSat ?? "—"}
            {"\n"}No. Certificado SAT: {timbre.noCertificadoSat ?? "—"}
            {"\n"}Este documento es una representación impresa de un CFDI.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
