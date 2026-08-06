import { NextResponse } from "next/server";
import { requirePermission } from "@/features/auth";
import { getLogoBytes } from "@/features/sucursales/repositories/sucursales-repository";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requirePermission("empresas.acceso");

  const logo = await getLogoBytes(Number(id), session.cliente.id);
  if (!logo) {
    return NextResponse.json({ error: "Esta empresa no tiene logo." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(logo.data), {
    headers: {
      "Content-Type": logo.mimeType,
      "Cache-Control": "private, max-age=300",
    },
  });
}
