"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, AlertTriangle, Ban, CheckCircle2, Download, FileCode2, FileText, Loader2, Mail, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ROUTES } from "@/config/routes";
import { eliminarBorradorAction } from "../actions";
import type { FacturaDetalle } from "../types";
import { CancelarFacturaModal } from "./CancelarFacturaModal";
import { EnviarCorreoModal } from "./EnviarCorreoModal";
import { FacturaForm } from "./FacturaForm";

const AVISO_CANCELACION: Record<string, string> = {
  solicitada: "Cancelación en proceso: pendiente de que el receptor la acepte o rechace (o venzan 72 h).",
  rechazada: "El receptor rechazó una solicitud de cancelación previa. La factura sigue vigente.",
  plazo_vencido: "Venció el plazo de una solicitud de cancelación anterior sin respuesta. La factura sigue vigente.",
};

const formatoMoneda = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

export function FacturaDetalleView({
  factura,
  puedeGestionar,
}: {
  factura: FacturaDetalle;
  puedeGestionar: boolean;
}) {
  const [eliminando, setEliminando] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [enviandoCorreo, setEnviandoCorreo] = useState(false);

  if (factura.estado === "borrador") {
    return (
      <div className="space-y-5">
        <FacturaForm mode="edit" initial={factura} />
        {puedeGestionar && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setEliminando(true)}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar borrador
            </button>
          </div>
        )}
        <EliminarBorradorModal open={eliminando} idFactura={factura.id} onClose={() => setEliminando(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-aurora-500 text-white"
            >
              <FileText className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Folio fiscal (UUID)</p>
              <p className="break-all font-mono text-sm font-medium text-ink">{factura.folioFiscal ?? "—"}</p>
            </div>
          </div>
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              factura.estado === "cancelada" ? "bg-red-500/10 text-red-500" : "bg-brand-50 text-brand-700 dark:text-brand-200"
            }`}
          >
            {factura.estado === "cancelada" ? <Ban className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            {factura.estado === "cancelada" ? "Cancelada" : "Timbrada"}
          </span>
        </div>

        <div className="mt-5 grid gap-4 border-t border-line pt-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Emisor</p>
            <p className="mt-0.5 text-ink">{factura.emisorNombre ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Receptor</p>
            <p className="mt-0.5 text-ink">{factura.receptorNombre ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Serie / Folio</p>
            <p className="mt-0.5 text-ink">
              {factura.serie ?? "—"} / {factura.folio ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Total</p>
            <p className="mt-0.5 font-semibold text-ink">{factura.total ? formatoMoneda.format(Number(factura.total)) : "—"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Fecha de timbrado</p>
            <p className="mt-0.5 text-ink">{factura.fechaTimbrado ?? "—"}</p>
          </div>
        </div>

        {factura.estatusCancelacion && AVISO_CANCELACION[factura.estatusCancelacion] && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-sunrise-400/30 bg-sunrise-300/20 px-3.5 py-3 dark:bg-sunrise-400/10">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-sunrise-500" />
            <p className="text-sm text-ink">{AVISO_CANCELACION[factura.estatusCancelacion]}</p>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <a
            href={`${ROUTES.facturacion}/${factura.id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-brand-800 dark:bg-brand-600 dark:text-brand-950 dark:hover:bg-brand-500"
          >
            <Download className="h-4 w-4" />
            Ver / imprimir PDF
          </a>
          <a
            href={`${ROUTES.facturacion}/${factura.id}/xml`}
            className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-brand-300 hover:text-brand-700 dark:hover:text-brand-300"
          >
            <FileCode2 className="h-4 w-4" />
            Descargar XML
          </a>
          {puedeGestionar && (
            <button
              type="button"
              onClick={() => setEnviandoCorreo(true)}
              className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-brand-300 hover:text-brand-700 dark:hover:text-brand-300"
            >
              <Mail className="h-4 w-4" />
              Enviar por correo
            </button>
          )}
          {puedeGestionar && factura.estado === "timbrada" && (
            <button
              type="button"
              onClick={() => setCancelando(true)}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10"
            >
              <Ban className="h-4 w-4" />
              Cancelar factura
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5 shadow-soft">
        <p className="mb-4 text-sm font-semibold text-ink-soft">Conceptos</p>
        <div className="overflow-hidden rounded-2xl border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-cloud/40 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                <th className="px-4 py-2.5">Concepto</th>
                <th className="px-4 py-2.5 text-right">Cantidad</th>
                <th className="px-4 py-2.5 text-right">Importe</th>
              </tr>
            </thead>
            <tbody>
              {factura.conceptos.map((c, i) => (
                <tr key={i} className="border-b border-line/60 last:border-0 hover:bg-cloud/30">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{c.descripcion}</p>
                    <p className="text-xs text-muted">
                      {c.claveProdServ} · {c.claveUnidad}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right text-ink-soft">{c.cantidad}</td>
                  <td className="px-4 py-3 text-right font-medium text-ink">{formatoMoneda.format(c.importe)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CancelarFacturaModal open={cancelando} idFactura={factura.id} onClose={() => setCancelando(false)} />
      <EnviarCorreoModal open={enviandoCorreo} idFactura={factura.id} onClose={() => setEnviandoCorreo(false)} />
    </div>
  );
}

function EliminarBorradorModal({
  open,
  idFactura,
  onClose,
}: {
  open: boolean;
  idFactura: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <Modal open={open} onClose={onClose} title="Eliminar borrador" size="sm">
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-sm text-ink">Esto elimina el borrador y sus conceptos. Esta acción no se puede deshacer.</p>
        </div>

        {error && (
          <p className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-sm font-medium text-red-500">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await eliminarBorradorAction(idFactura);
                router.push(ROUTES.facturacion);
                router.refresh();
              })
            }
            className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-red-700 disabled:opacity-70"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Sí, eliminar
          </button>
          <button type="button" onClick={onClose} className="rounded-full px-4 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:text-brand-600">
            Cancelar
          </button>
        </div>
      </div>
    </Modal>
  );
}
