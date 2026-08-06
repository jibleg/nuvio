"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Banknote, CheckCircle2, Pencil, Plus, Search, Wallet } from "lucide-react";
import { ROUTES } from "@/config/routes";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatTile } from "@/components/ui/StatTile";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";
import type { PagoListItem } from "../types";

const formatoMoneda = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

const TONE_POR_ESTADO: Record<PagoListItem["estado"], StatusTone> = {
  borrador: "neutral",
  timbrada: "brand",
  cancelada: "danger",
};

const ETIQUETA_POR_ESTADO: Record<PagoListItem["estado"], string> = {
  borrador: "Borrador",
  timbrada: "Timbrado",
  cancelada: "Cancelado",
};

export function PagosListado({ pagos, puedeGestionar }: { pagos: PagoListItem[]; puedeGestionar: boolean }) {
  const [busqueda, setBusqueda] = useState("");

  const resumen = useMemo(() => {
    const timbrados = pagos.filter((p) => p.estado === "timbrada");
    const cobrado = timbrados.reduce((acc, p) => acc + (p.monto ? Number(p.monto) : 0), 0);
    return { timbrados: timbrados.length, borradores: pagos.filter((p) => p.estado === "borrador").length, cobrado };
  }, [pagos]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return pagos;
    return pagos.filter(
      (p) => p.receptorNombre?.toLowerCase().includes(q) || p.folioFiscal?.toLowerCase().includes(q),
    );
  }, [pagos, busqueda]);

  const columns: DataTableColumn<PagoListItem>[] = [
    {
      key: "pago",
      header: "Complemento",
      render: (p) => (
        <Link href={`${ROUTES.facturacion}/pagos/${p.id}`} className="group flex items-center gap-3">
          <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-aurora-500 text-white">
            <Banknote className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            {p.folioFiscal ? (
              <p className="truncate font-mono text-xs font-medium text-ink group-hover:text-brand-700 dark:group-hover:text-brand-300">
                {p.folioFiscal}
              </p>
            ) : (
              <p className="font-semibold text-ink group-hover:text-brand-700 dark:group-hover:text-brand-300">Borrador #{p.id}</p>
            )}
            <p className="text-xs text-muted">{p.documentos} {p.documentos === 1 ? "factura" : "facturas"}</p>
          </div>
        </Link>
      ),
    },
    { key: "receptor", header: "Cliente", render: (p) => <span className="text-ink-soft">{p.receptorNombre ?? "—"}</span> },
    { key: "fechaPago", header: "Fecha de pago", render: (p) => <span className="text-ink-soft">{p.fechaPago ?? "—"}</span> },
    {
      key: "monto",
      header: "Monto",
      align: "right",
      render: (p) => <span className="font-medium text-ink">{p.monto ? formatoMoneda.format(Number(p.monto)) : "—"}</span>,
    },
    {
      key: "estado",
      header: "Estado",
      render: (p) => <StatusBadge tone={TONE_POR_ESTADO[p.estado]}>{ETIQUETA_POR_ESTADO[p.estado]}</StatusBadge>,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile icon={Wallet} label="Cobrado" value={formatoMoneda.format(resumen.cobrado)} accent="from-brand-400 to-aurora-500" />
        <StatTile icon={CheckCircle2} label="Timbrados" value={resumen.timbrados} accent="from-emerald-400 to-brand-500" />
        <StatTile icon={Pencil} label="Borradores" value={resumen.borradores} accent="from-sky-soft to-brand-400" />
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
            href={`${ROUTES.facturacion}/pagos/nuevo`}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-brand-800 dark:bg-brand-600 dark:text-brand-950 dark:hover:bg-brand-500"
          >
            <Plus className="h-4 w-4" />
            Registrar pago
          </Link>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filtrados}
        getRowKey={(p) => p.id}
        emptyState={
          <EmptyState
            icon={Banknote}
            title={pagos.length === 0 ? "Aún no hay complementos de pago" : "Sin resultados"}
            description={
              pagos.length === 0
                ? "Cuando registres el cobro de una factura a crédito, aparecerá aquí."
                : "Ajusta la búsqueda para ver más resultados."
            }
          />
        }
      />
    </div>
  );
}
