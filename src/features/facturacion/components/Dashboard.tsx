"use client";

import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Banknote, CheckCircle2, Download, FileText, Pencil, Plus, Trophy, Wallet } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { DateField } from "@/components/ui/DateField";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatTile } from "@/components/ui/StatTile";
import { ROUTES } from "@/config/routes";
import type { AntiguedadBucket, ClienteTop, FacturadoDia, ResumenFacturacion } from "../repositories/dashboard-repository";

const formatoMoneda = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
const formatoCompacto = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  notation: "compact",
  maximumFractionDigits: 1,
});

/**
 * Terna verde/ámbar/rojo validada con el skill `dataviz` (references/palette.md,
 * paleta de status) contra las superficies de Nuvio (#ffffff claro /
 * #0c2a2f oscuro): separación CVD y de visión normal pasan en ambos modos;
 * el ámbar queda por debajo de 3:1 de contraste en superficie clara — la
 * mitigación de la propia guía es la etiqueta directa de valor sobre la
 * barra, que este chart ya trae.
 */
const COLOR_BUCKET: Record<AntiguedadBucket["bucket"], string> = {
  "0-30": "#0ca30c",
  "31-60": "#fab219",
  "61+": "#d03b3b",
};
const ETIQUETA_BUCKET: Record<AntiguedadBucket["bucket"], string> = {
  "0-30": "0–30 días",
  "31-60": "31–60 días",
  "61+": "61+ días",
};

function formatoDiaCorto(fecha: string): string {
  const [, mes, dia] = fecha.split("-");
  const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${Number(dia)} ${meses[Number(mes) - 1]}`;
}

function TooltipFacturado({ active, payload }: { active?: boolean; payload?: { payload: FacturadoDia }[] }) {
  if (!active || !payload?.[0]) return null;
  const punto = payload[0].payload;
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-glow">
      <p className="font-semibold text-ink">{formatoDiaCorto(punto.fecha)}</p>
      <p className="mt-0.5 text-muted">{formatoMoneda.format(punto.total)}</p>
    </div>
  );
}

function TooltipBucket({ active, payload }: { active?: boolean; payload?: { payload: AntiguedadBucket }[] }) {
  if (!active || !payload?.[0]) return null;
  const bucket = payload[0].payload;
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-glow">
      <p className="font-semibold text-ink">{ETIQUETA_BUCKET[bucket.bucket]}</p>
      <p className="mt-0.5 text-muted">{formatoMoneda.format(bucket.total)}</p>
    </div>
  );
}

export function Dashboard({
  resumen,
  facturadoDiario,
  cuentasPorCobrar,
  topClientes,
  puedeGestionar,
  paqueteDesdeDefault,
  paqueteHastaDefault,
}: {
  resumen: ResumenFacturacion;
  facturadoDiario: FacturadoDia[];
  cuentasPorCobrar: { buckets: AntiguedadBucket[]; total: number };
  topClientes: ClienteTop[];
  puedeGestionar: boolean;
  paqueteDesdeDefault: string;
  paqueteHastaDefault: string;
}) {
  const maxCliente = Math.max(1, ...topClientes.map((c) => c.total));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon={Wallet}
          label="Facturado este mes"
          value={formatoMoneda.format(resumen.facturadoMes)}
          accent="from-brand-400 to-aurora-500"
        />
        <StatTile
          icon={CheckCircle2}
          label="Timbradas este mes"
          value={resumen.timbradasMes}
          accent="from-emerald-400 to-brand-500"
        />
        <StatTile
          icon={Banknote}
          label="Cuentas por cobrar"
          value={formatoMoneda.format(cuentasPorCobrar.total)}
          accent="from-sunrise-300 to-sunrise-500"
          hint="Saldo de facturas a crédito"
        />
        <StatTile icon={Pencil} label="Borradores abiertos" value={resumen.borradores} accent="from-sky-soft to-brand-400" />
      </div>

      {puedeGestionar && (
        <div className="flex flex-wrap gap-3">
          <Link
            href={`${ROUTES.facturacion}/nueva`}
            className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-brand-800 dark:bg-brand-600 dark:text-brand-950 dark:hover:bg-brand-500"
          >
            <Plus className="h-4 w-4" />
            Nueva factura
          </Link>
          <Link
            href={`${ROUTES.facturacion}/pagos/nuevo`}
            className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-brand-300 hover:text-brand-700 dark:hover:text-brand-300"
          >
            <Banknote className="h-4 w-4" />
            Registrar pago
          </Link>
          <Link
            href={`${ROUTES.facturacion}/consultar`}
            className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-brand-300 hover:text-brand-700 dark:hover:text-brand-300"
          >
            <FileText className="h-4 w-4" />
            Consultar facturas
          </Link>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Facturado" description="Últimos 30 días" className="lg:col-span-2" bodyClassName="p-5 pt-2">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={facturadoDiario} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="facturadoFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-brand-500)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--color-line)" strokeDasharray="3 3" />
              <XAxis
                dataKey="fecha"
                tickFormatter={formatoDiaCorto}
                tick={{ fontSize: 11, fill: "var(--color-muted)" }}
                axisLine={{ stroke: "var(--color-line)" }}
                tickLine={false}
                minTickGap={28}
              />
              <YAxis hide domain={[0, (max: number) => (max === 0 ? 1 : max * 1.15)]} />
              <Tooltip content={<TooltipFacturado />} />
              <Area
                type="monotone"
                dataKey="total"
                stroke="var(--color-brand-600)"
                strokeWidth={2}
                fill="url(#facturadoFill)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Cuentas por cobrar" description="Por antigüedad" bodyClassName="p-5 pt-2">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={cuentasPorCobrar.buckets}
              margin={{ top: 24, right: 8, left: 0, bottom: 0 }}
              barCategoryGap="28%"
            >
              <CartesianGrid vertical={false} stroke="var(--color-line)" strokeDasharray="3 3" />
              <XAxis
                dataKey="bucket"
                tickFormatter={(b: AntiguedadBucket["bucket"]) => ETIQUETA_BUCKET[b]}
                tick={{ fontSize: 10, fill: "var(--color-muted)" }}
                axisLine={{ stroke: "var(--color-line)" }}
                tickLine={false}
              />
              <YAxis hide domain={[0, (max: number) => (max === 0 ? 1 : max * 1.25)]} />
              <Tooltip content={<TooltipBucket />} cursor={{ fill: "var(--color-cloud)" }} />
              <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={56}>
                {cuentasPorCobrar.buckets.map((b) => (
                  <Cell key={b.bucket} fill={COLOR_BUCKET[b.bucket]} />
                ))}
                <LabelList
                  dataKey="total"
                  position="top"
                  formatter={(v: unknown) => (typeof v === "number" && v > 0 ? formatoCompacto.format(v) : "")}
                  style={{ fontSize: 10, fontWeight: 600, fill: "var(--color-ink)" }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card
        title={
          <span className="flex items-center gap-2">
            <Trophy className="h-4 w-4 shrink-0 text-brand-600" />
            Mejores clientes
          </span>
        }
        description="Últimos 30 días"
        bodyClassName="p-5"
      >
        {topClientes.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="Aún no hay facturas en este periodo"
            description="Cuando timbres facturas, tus mejores clientes aparecerán aquí."
          />
        ) : (
          <div className="space-y-4">
            {topClientes.map((c, i) => (
              <div key={c.idContacto} className="flex items-center gap-3">
                <span className="w-4 shrink-0 text-xs font-semibold text-muted">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-medium text-ink">{c.nombre}</span>
                    <span className="shrink-0 text-ink-soft">{formatoMoneda.format(c.total)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-cloud">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-400 to-aurora-500"
                      style={{ width: `${(c.total / maxCliente) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card
        title="Paquete contable"
        description="XML y PDF de todas las facturas y pagos timbrados del periodo, en un ZIP — listo para tu contador"
        bodyClassName="p-5 pt-3"
      >
        <form
          action={`${ROUTES.facturacion}/paquete`}
          method="get"
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <label htmlFor="paquete-desde" className="mb-1 block text-xs font-medium text-muted">
              Desde
            </label>
            <DateField
              id="paquete-desde"
              name="desde"
              defaultValue={paqueteDesdeDefault}
              required
            />
          </div>
          <div className="flex-1">
            <label htmlFor="paquete-hasta" className="mb-1 block text-xs font-medium text-muted">
              Hasta
            </label>
            <DateField
              id="paquete-hasta"
              name="hasta"
              defaultValue={paqueteHastaDefault}
              required
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-brand-800 dark:bg-brand-600 dark:text-brand-950 dark:hover:bg-brand-500"
          >
            <Download className="h-4 w-4" />
            Descargar ZIP
          </button>
        </form>
      </Card>
    </div>
  );
}
