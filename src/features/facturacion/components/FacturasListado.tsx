"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FileText, Plus, Search } from "lucide-react";
import { ROUTES } from "@/config/routes";
import type { FacturaListItem } from "../types";

const formatoMoneda = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

const badgePorEstado: Record<FacturaListItem["estado"], string> = {
  borrador: "bg-cloud text-muted",
  timbrada: "bg-brand-50 text-brand-700 dark:text-brand-200",
  cancelada: "bg-red-500/10 text-red-500",
};

const etiquetaEstado: Record<FacturaListItem["estado"], string> = {
  borrador: "Borrador",
  timbrada: "Timbrada",
  cancelada: "Cancelada",
};

export function FacturasListado({
  facturas,
  puedeGestionar,
}: {
  facturas: FacturaListItem[];
  puedeGestionar: boolean;
}) {
  const [busqueda, setBusqueda] = useState("");

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return facturas;
    return facturas.filter(
      (f) =>
        f.receptorNombre?.toLowerCase().includes(q) ||
        f.emisorNombre?.toLowerCase().includes(q) ||
        f.folioFiscal?.toLowerCase().includes(q),
    );
  }, [facturas, busqueda]);

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

      {filtradas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface/60 p-10 text-center text-sm text-muted">
          {facturas.length === 0 ? "Aún no hay facturas." : "Sin resultados para tu búsqueda."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-soft">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wide text-muted">
                <th className="px-5 py-3">Factura</th>
                <th className="px-5 py-3">Emisor</th>
                <th className="px-5 py-3">Receptor</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((f) => (
                <tr key={f.id} className="border-b border-line/60 last:border-0 hover:bg-cloud/50">
                  <td className="px-5 py-3.5">
                    <Link href={`${ROUTES.facturacion}/${f.id}`} className="flex items-center gap-3 group">
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
                  </td>
                  <td className="px-5 py-3.5 text-ink-soft">{f.emisorNombre ?? "—"}</td>
                  <td className="px-5 py-3.5 text-ink-soft">{f.receptorNombre ?? "—"}</td>
                  <td className="px-5 py-3.5 font-medium text-ink">
                    {f.total ? formatoMoneda.format(Number(f.total)) : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgePorEstado[f.estado]}`}
                    >
                      {etiquetaEstado[f.estado]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
