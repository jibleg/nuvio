"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Ban, CheckCircle2, FileText, Pencil, Plus, Search, Wallet } from "lucide-react";
import { ROUTES } from "@/config/routes";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatTile } from "@/components/ui/StatTile";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";
import type { FacturaListItem } from "../types";

const formatoMoneda = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

const TONE_POR_ESTADO: Record<FacturaListItem["estado"], StatusTone> = {
  borrador: "neutral",
  timbrada: "brand",
  cancelada: "danger",
};

const ETIQUETA_POR_ESTADO: Record<FacturaListItem["estado"], string> = {
  borrador: "Borrador",
  timbrada: "Timbrada",
  cancelada: "Cancelada",
};

const ICONO_POR_ESTADO: Record<FacturaListItem["estado"], typeof FileText> = {
  borrador: Pencil,
  timbrada: CheckCircle2,
  cancelada: Ban,
};

type Filtro = "todas" | FacturaListItem["estado"];

const FILTROS: { value: Filtro; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "borrador", label: "Borradores" },
  { value: "timbrada", label: "Timbradas" },
  { value: "cancelada", label: "Canceladas" },
];

export function FacturasListado({
  facturas,
  puedeGestionar,
}: {
  facturas: FacturaListItem[];
  puedeGestionar: boolean;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const resumen = useMemo(() => {
    const timbradas = facturas.filter((f) => f.estado === "timbrada");
    const facturado = timbradas.reduce((acc, f) => acc + (f.total ? Number(f.total) : 0), 0);
    return {
      timbradas: timbradas.length,
      borradores: facturas.filter((f) => f.estado === "borrador").length,
      canceladas: facturas.filter((f) => f.estado === "cancelada").length,
      facturado,
    };
  }, [facturas]);

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return facturas.filter((f) => {
      if (filtro !== "todas" && f.estado !== filtro) return false;
      if (desde && (!f.fechaTimbrado || f.fechaTimbrado < desde)) return false;
      if (hasta && (!f.fechaTimbrado || f.fechaTimbrado > `${hasta}T23:59:59`)) return false;
      if (!q) return true;
      return (
        f.receptorNombre?.toLowerCase().includes(q) ||
        f.emisorNombre?.toLowerCase().includes(q) ||
        f.folioFiscal?.toLowerCase().includes(q)
      );
    });
  }, [facturas, busqueda, filtro, desde, hasta]);

  const columns: DataTableColumn<FacturaListItem>[] = [
    {
      key: "factura",
      header: "Factura",
      render: (f) => (
        <Link href={`${ROUTES.facturacion}/${f.id}`} className="group flex items-center gap-3">
          <span
            aria-hidden
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-aurora-500 text-white"
          >
            <FileText className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            {f.folioFiscal ? (
              <p className="truncate font-mono text-xs font-medium text-ink group-hover:text-brand-700 dark:group-hover:text-brand-300">
                {f.folioFiscal}
              </p>
            ) : (
              <p className="font-semibold text-ink group-hover:text-brand-700 dark:group-hover:text-brand-300">
                Borrador #{f.id}
              </p>
            )}
            {f.serie || f.folio ? (
              <p className="text-xs text-muted">
                Serie {f.serie ?? "—"} · Folio {f.folio ?? "—"}
              </p>
            ) : null}
          </div>
        </Link>
      ),
    },
    { key: "emisor", header: "Emisor", render: (f) => <span className="text-ink-soft">{f.emisorNombre ?? "—"}</span> },
    { key: "receptor", header: "Receptor", render: (f) => <span className="text-ink-soft">{f.receptorNombre ?? "—"}</span> },
    {
      key: "total",
      header: "Total",
      align: "right",
      render: (f) => (
        <span className="font-medium text-ink">{f.total ? formatoMoneda.format(Number(f.total)) : "—"}</span>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      render: (f) => {
        const Icono = ICONO_POR_ESTADO[f.estado];
        return (
          <StatusBadge tone={TONE_POR_ESTADO[f.estado]} icon={<Icono className="h-3 w-3" />}>
            {ETIQUETA_POR_ESTADO[f.estado]}
          </StatusBadge>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={Wallet} label="Facturado" value={formatoMoneda.format(resumen.facturado)} accent="from-brand-400 to-aurora-500" />
        <StatTile icon={CheckCircle2} label="Timbradas" value={resumen.timbradas} accent="from-emerald-400 to-brand-500" />
        <StatTile icon={Pencil} label="Borradores" value={resumen.borradores} accent="from-sky-soft to-brand-400" />
        <StatTile icon={Ban} label="Canceladas" value={resumen.canceladas} accent="from-slate-400 to-slate-500" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por cliente o folio fiscal"
            className="w-full rounded-full border border-line bg-surface py-2.5 pl-10 pr-4 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-brand-400"
          />
        </div>
        {puedeGestionar && (
          <Link
            href={`${ROUTES.facturacion}/nueva`}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-brand-800 dark:bg-brand-600 dark:text-brand-950 dark:hover:bg-brand-500"
          >
            <Plus className="h-4 w-4" />
            Nueva factura
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTROS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFiltro(f.value)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                filtro === f.value
                  ? "bg-brand-700 text-white dark:bg-brand-600 dark:text-brand-950"
                  : "border border-line text-ink-soft hover:border-brand-300 hover:text-brand-700 dark:hover:text-brand-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted">
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-brand-400"
            aria-label="Desde"
          />
          <span>—</span>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-brand-400"
            aria-label="Hasta"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtradas}
        getRowKey={(f) => f.id}
        emptyState={
          <EmptyState
            icon={FileText}
            title={facturas.length === 0 ? "Aún no hay facturas" : "Sin resultados"}
            description={
              facturas.length === 0
                ? "Cuando emitas tu primera factura, aparecerá aquí."
                : "Ajusta la búsqueda o los filtros para ver más resultados."
            }
          />
        }
      />
    </div>
  );
}
