import { and, desc, eq, gte, isNotNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { empresas, factura } from "@/lib/db/schema";
import { TIPO_COMPROBANTE_INGRESO } from "./facturas-repository";
import { listFacturasPorPagar } from "./pagos-repository";

/**
 * Consultas agregadas para el dashboard del módulo — separadas de
 * `facturas-repository` (ya con 300+ líneas) y de `pagos-repository`, que
 * resuelve la lectura fila-por-factura, no agregados para gráficos.
 */

const DIA_MS = 86_400_000;

function fechaISO(offsetDias: number): string {
  return new Date(Date.now() - offsetDias * DIA_MS).toISOString().slice(0, 10);
}

export type ResumenFacturacion = {
  facturadoMes: number;
  timbradasMes: number;
  timbradasTotal: number;
  borradores: number;
  canceladas: number;
  canceladasTotal: number;
};

/** Conteos y facturado del mes en curso — para los stat tiles del dashboard. */
export async function getResumenFacturacion(idCliente: number): Promise<ResumenFacturacion> {
  const desdeMes = fechaISO(new Date().getDate() - 1);
  const [row] = await db
    .select({
      facturadoMes: sql<string>`coalesce(sum(${factura.importe}) filter (where ${factura.tipoFactura} = 1 and ${factura.fechaTimbrado} >= ${desdeMes} and ${factura.estatusCancelacion} is distinct from 'cancelada'), 0)`,
      timbradasMes: sql<number>`count(*) filter (where ${factura.tipoFactura} = 1 and ${factura.fechaTimbrado} >= ${desdeMes} and ${factura.estatusCancelacion} is distinct from 'cancelada')::int`,
      timbradasTotal: sql<number>`count(*) filter (where ${factura.tipoFactura} = 1 and ${factura.estatusCancelacion} is distinct from 'cancelada')::int`,
      borradores: sql<number>`count(*) filter (where ${factura.tipoFactura} = 0)::int`,
      canceladas: sql<number>`count(*) filter (where ${factura.estatusCancelacion} = 'cancelada')::int`,
      canceladasTotal: sql<string>`coalesce(sum(${factura.importe}) filter (where ${factura.estatusCancelacion} = 'cancelada'), 0)`,
    })
    .from(factura)
    .innerJoin(empresas, eq(empresas.id, factura.idEmpresaEmisora))
    .where(and(eq(empresas.idCliente, idCliente), eq(factura.idTipoComprobante, TIPO_COMPROBANTE_INGRESO)));

  return {
    facturadoMes: Number(row?.facturadoMes ?? 0),
    timbradasMes: row?.timbradasMes ?? 0,
    timbradasTotal: row?.timbradasTotal ?? 0,
    borradores: row?.borradores ?? 0,
    canceladas: row?.canceladas ?? 0,
    canceladasTotal: Number(row?.canceladasTotal ?? 0),
  };
}

export type FacturadoDia = { fecha: string; total: number };

/** Facturado por día en los últimos `dias` — con los días sin facturas en 0 (línea continua, sin huecos). */
export async function getFacturadoPorDia(idCliente: number, dias = 30): Promise<FacturadoDia[]> {
  const desde = fechaISO(dias - 1);
  const rows = await db
    .select({
      fecha: sql<string>`substring(${factura.fechaTimbrado}, 1, 10)`,
      total: sql<string>`coalesce(sum(${factura.importe}), 0)`,
    })
    .from(factura)
    .innerJoin(empresas, eq(empresas.id, factura.idEmpresaEmisora))
    .where(
      and(
        eq(empresas.idCliente, idCliente),
        eq(factura.idTipoComprobante, TIPO_COMPROBANTE_INGRESO),
        eq(factura.tipoFactura, 1),
        gte(factura.fechaTimbrado, desde),
      ),
    )
    .groupBy(sql`substring(${factura.fechaTimbrado}, 1, 10)`);

  const porDia = new Map(rows.map((r) => [r.fecha, Number(r.total)]));
  const resultado: FacturadoDia[] = [];
  for (let i = dias - 1; i >= 0; i--) {
    const f = fechaISO(i);
    resultado.push({ fecha: f, total: porDia.get(f) ?? 0 });
  }
  return resultado;
}

export type ClienteTop = { idContacto: number; nombre: string; total: number };

/** Los clientes con más facturado en los últimos `dias`. */
export async function getTopClientes(idCliente: number, limite = 5, dias = 30): Promise<ClienteTop[]> {
  const desde = fechaISO(dias - 1);
  const rows = await db
    .select({
      idContacto: factura.idContactoFacturacion,
      nombre: factura.nombre,
      total: sql<string>`coalesce(sum(${factura.importe}), 0)`,
    })
    .from(factura)
    .innerJoin(empresas, eq(empresas.id, factura.idEmpresaEmisora))
    .where(
      and(
        eq(empresas.idCliente, idCliente),
        eq(factura.idTipoComprobante, TIPO_COMPROBANTE_INGRESO),
        eq(factura.tipoFactura, 1),
        gte(factura.fechaTimbrado, desde),
        isNotNull(factura.idContactoFacturacion),
      ),
    )
    .groupBy(factura.idContactoFacturacion, factura.nombre)
    .orderBy(desc(sql`sum(${factura.importe})`))
    .limit(limite);

  return rows.map((r) => ({ idContacto: r.idContacto as number, nombre: r.nombre ?? "—", total: Number(r.total) }));
}

export type AntiguedadBucket = { bucket: "0-30" | "31-60" | "61+"; total: number };

/**
 * Cuentas por cobrar (saldo de facturas PPD vigentes) agrupadas por
 * antigüedad desde el timbrado. Reusa `listFacturasPorPagar` (misma fuente
 * de verdad que "Registrar pago" y la tarjeta de saldo en el detalle de
 * factura) en vez de recalcular el saldo con SQL aparte.
 */
export async function getCuentasPorCobrarPorAntiguedad(
  idCliente: number,
): Promise<{ buckets: AntiguedadBucket[]; total: number }> {
  const porPagar = await listFacturasPorPagar(idCliente);
  const ahora = Date.now();
  const montos: Record<AntiguedadBucket["bucket"], number> = { "0-30": 0, "31-60": 0, "61+": 0 };

  for (const f of porPagar) {
    const dias = f.fechaTimbrado ? Math.floor((ahora - new Date(f.fechaTimbrado).getTime()) / DIA_MS) : 0;
    const bucket: AntiguedadBucket["bucket"] = dias <= 30 ? "0-30" : dias <= 60 ? "31-60" : "61+";
    montos[bucket] += f.saldo;
  }

  return {
    buckets: (["0-30", "31-60", "61+"] as const).map((bucket) => ({ bucket, total: Math.round(montos[bucket] * 100) / 100 })),
    total: Math.round(porPagar.reduce((acc, f) => acc + f.saldo, 0) * 100) / 100,
  };
}
