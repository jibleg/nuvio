import { ZipArchive } from "archiver";
import { armarPdfFactura } from "../pdf/armar-pdf-factura";
import { armarPdfPago } from "../pdf/armar-pdf-pago";
import { getFacturasTimbradasEnRango, getPagosTimbradosEnRango } from "../queries";
import { getFacturaDetalle, getXmlTimbrado } from "../repositories/facturas-repository";
import { getPagoDetalle } from "../repositories/pagos-repository";

function construirZip(entries: { name: string; data: Buffer }[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const archive = new ZipArchive({ zlib: { level: 9 } });
    const chunks: Buffer[] = [];
    archive.on("data", (chunk: Buffer) => chunks.push(chunk));
    archive.on("error", reject);
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    for (const e of entries) archive.append(e.data, { name: e.name });
    void archive.finalize();
  });
}

/**
 * ZIP con XML+PDF de cada factura y complemento de pago timbrados en el
 * rango — lo que un contador necesita del periodo sin pedirlo comprobante
 * por comprobante (Fase D). `null` si no hay nada timbrado en el rango.
 */
export async function armarPaqueteContable(
  idCliente: number,
  desde: string,
  hasta: string,
  idEmpresaEmisora?: number,
): Promise<Buffer | null> {
  const [facturas, pagos] = await Promise.all([
    getFacturasTimbradasEnRango(idCliente, desde, hasta, idEmpresaEmisora),
    getPagosTimbradosEnRango(idCliente, desde, hasta, idEmpresaEmisora),
  ]);

  const entries: { name: string; data: Buffer }[] = [];

  for (const f of facturas) {
    const detalle = await getFacturaDetalle(f.id, idCliente);
    if (!detalle) continue;
    const [pdf, xml] = await Promise.all([
      armarPdfFactura(detalle, idCliente),
      getXmlTimbrado(f.id, idCliente),
    ]);
    const nombre = detalle.folioFiscal ?? String(f.id);
    entries.push({ name: `facturas/factura-${nombre}.pdf`, data: pdf });
    if (xml) entries.push({ name: `facturas/factura-${nombre}.xml`, data: Buffer.from(xml, "utf-8") });
  }

  for (const p of pagos) {
    const detalle = await getPagoDetalle(p.id, idCliente);
    if (!detalle) continue;
    const [pdf, xml] = await Promise.all([
      armarPdfPago(detalle, idCliente),
      getXmlTimbrado(p.id, idCliente),
    ]);
    const nombre = detalle.folioFiscal ?? String(p.id);
    entries.push({ name: `pagos/pago-${nombre}.pdf`, data: pdf });
    if (xml) entries.push({ name: `pagos/pago-${nombre}.xml`, data: Buffer.from(xml, "utf-8") });
  }

  if (entries.length === 0) return null;
  return construirZip(entries);
}
