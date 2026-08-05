import { and, asc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { empresas } from "@/lib/db/schema";

/**
 * Resolución del EMISOR de una factura: solo la matriz o una sucursal con
 * identidad fiscal propia pueden emitir CFDI (una sucursal que hereda RFC de
 * la matriz factura, de hecho, como la matriz — no tiene su propio CSD). El
 * RFC/razón social/régimen de estas filas siempre son propios (nunca NULL,
 * ya validado por `sucursales/use-cases/update-sucursal.ts`), así que aquí
 * no hace falta el COALESCE-con-matriz que sí usa `sucursales-repository`.
 */
const esEmpresaPropia = eq(empresas.tipo, 1);

export type EmisorListItem = { id: number; nombreComercial: string; rfc: string };

export async function listEmisores(idCliente: number): Promise<EmisorListItem[]> {
  const rows = await db
    .select({ id: empresas.id, nombreComercial: empresas.nombreComercial, rfc: empresas.rfc })
    .from(empresas)
    .where(and(eq(empresas.idCliente, idCliente), esEmpresaPropia, isNotNull(empresas.rfc)))
    .orderBy(asc(empresas.nombreComercial));
  return rows.map((r) => ({ id: r.id, nombreComercial: r.nombreComercial, rfc: r.rfc as string }));
}

export type EmisorDetalle = {
  id: number;
  nombreComercial: string;
  rfc: string;
  razonSocial: string;
  idRegimen: number;
  codigoPostal: number | null;
  serie: string | null;
  csd: { cer: Buffer; key: Buffer; passwordEnc: Buffer; numeroCertificado: string } | null;
};

export async function getEmisorDetalle(idEmpresa: number, idCliente: number): Promise<EmisorDetalle | null> {
  const [row] = await db
    .select({
      id: empresas.id,
      nombreComercial: empresas.nombreComercial,
      rfc: empresas.rfc,
      razonSocial: empresas.razonSocial,
      idRegimen: empresas.idRegimen,
      codigoPostal: empresas.codigoPostal,
      serie: empresas.serie,
      signCer: empresas.signCer,
      signKey: empresas.signKey,
      signPasswordEnc: empresas.signPasswordEnc,
      signNumeroCertificado: empresas.signNumeroCertificado,
    })
    .from(empresas)
    .where(and(eq(empresas.id, idEmpresa), eq(empresas.idCliente, idCliente), esEmpresaPropia))
    .limit(1);
  if (!row || !row.rfc || !row.razonSocial || !row.idRegimen) return null;

  const csd =
    row.signCer && row.signKey && row.signPasswordEnc && row.signNumeroCertificado
      ? {
          cer: row.signCer,
          key: row.signKey,
          passwordEnc: row.signPasswordEnc,
          numeroCertificado: row.signNumeroCertificado,
        }
      : null;

  return {
    id: row.id,
    nombreComercial: row.nombreComercial,
    rfc: row.rfc,
    razonSocial: row.razonSocial,
    idRegimen: row.idRegimen,
    codigoPostal: row.codigoPostal,
    serie: row.serie,
    csd,
  };
}
