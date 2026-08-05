import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { empresas } from "@/lib/db/schema";
import type { CsdDetalle } from "../types";

export async function getCsdDetalle(idEmpresa: number, idCliente: number): Promise<CsdDetalle | null> {
  const [row] = await db
    .select({
      signCer: empresas.signCer,
      signNumeroCertificado: empresas.signNumeroCertificado,
      signValidoDesde: empresas.signValidoDesde,
      signValidoHasta: empresas.signValidoHasta,
    })
    .from(empresas)
    .where(and(eq(empresas.id, idEmpresa), eq(empresas.idCliente, idCliente)))
    .limit(1);
  if (!row) return null;

  return {
    tieneCsd: row.signCer !== null,
    numeroCertificado: row.signNumeroCertificado,
    validoDesde: row.signValidoDesde?.toISOString() ?? null,
    validoHasta: row.signValidoHasta?.toISOString() ?? null,
  };
}

export async function guardarCsd(
  idEmpresa: number,
  idCliente: number,
  data: {
    cer: Buffer;
    key: Buffer;
    passwordEnc: Buffer;
    numeroCertificado: string;
    validoDesde: Date;
    validoHasta: Date;
  },
): Promise<void> {
  await db
    .update(empresas)
    .set({
      signCer: data.cer,
      signKey: data.key,
      signPasswordEnc: data.passwordEnc,
      signNumeroCertificado: data.numeroCertificado,
      signValidoDesde: data.validoDesde,
      signValidoHasta: data.validoHasta,
    })
    .where(and(eq(empresas.id, idEmpresa), eq(empresas.idCliente, idCliente)));
}
