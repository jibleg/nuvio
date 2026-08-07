import { NextResponse } from "next/server";
import { requirePermission } from "@/features/auth";
import { armarPaqueteContable } from "@/features/facturacion/paquete/armar-paquete-contable";

export async function GET(req: Request) {
  const session = await requirePermission("facturas.consulta");
  const { searchParams } = new URL(req.url);
  const desde = searchParams.get("desde");
  const hasta = searchParams.get("hasta");
  const emisorParam = searchParams.get("emisor");
  const idEmpresaEmisora = emisorParam ? Number(emisorParam) : undefined;

  if (!desde || !hasta) {
    return NextResponse.json({ error: "Indica un rango de fechas (desde y hasta)." }, { status: 400 });
  }

  const zip = await armarPaqueteContable(session.cliente.id, desde, hasta, idEmpresaEmisora);
  if (!zip) {
    return NextResponse.json({ error: "No hay comprobantes timbrados en ese rango de fechas." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(zip), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="paquete-contable-${desde}-a-${hasta}.zip"`,
    },
  });
}
