"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, AlertTriangle, Ban, CheckCircle2, FileCode2, Loader2, SearchCheck, Trash2, Zap } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ROUTES } from "@/config/routes";
import { notifyError, notifySuccess } from "@/lib/toast";
import { eliminarBorradorPagoAction, timbrarPagoAction, verificarEstatusCancelacionAction } from "../actions";
import type { PagoDetalle } from "../types";
import { CancelarPagoModal } from "./CancelarPagoModal";
import { PdfPreviewPanel, PdfToggleButton } from "./PdfViewer";

const AVISO_CANCELACION: Record<string, string> = {
  solicitada: "Cancelación en proceso: pendiente de que el receptor la acepte o rechace (o venzan 72 h).",
  rechazada: "El receptor rechazó una solicitud de cancelación previa. El complemento sigue vigente.",
  plazo_vencido: "Venció el plazo de una solicitud de cancelación anterior sin respuesta. El complemento sigue vigente.",
};

const formatoMoneda = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

export function PagoDetalleView({ pago, puedeGestionar }: { pago: PagoDetalle; puedeGestionar: boolean }) {
  const router = useRouter();
  const [eliminando, setEliminando] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [timbrando, setTimbrando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificando, setVerificando] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [verPdf, setVerPdf] = useState(false);
  const pdfSrc = `${ROUTES.facturacion}/pagos/${pago.id}/pdf`;

  const verificarEstatusCancelacion = () => {
    setVerificando(true);
    startTransition(async () => {
      const result = await verificarEstatusCancelacionAction(pago.id);
      setVerificando(false);
      if (!result.ok) {
        notifyError(result.error);
        return;
      }
      notifySuccess(result.mensaje);
      router.refresh();
    });
  };

  if (pago.estado === "borrador") {
    return (
      <div className="space-y-5">
        <Card bodyClassName="p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Borrador de complemento de pago</p>
          <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Cliente</p>
              <p className="mt-0.5 text-ink">{pago.receptorNombre ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Monto</p>
              <p className="mt-0.5 font-semibold text-ink">{pago.monto ? formatoMoneda.format(Number(pago.monto)) : "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Fecha de pago</p>
              <p className="mt-0.5 text-ink">{pago.fechaPago ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Facturas relacionadas</p>
              <p className="mt-0.5 text-ink">{pago.documentos}</p>
            </div>
          </div>

          {error && (
            <p className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-sm font-medium text-red-500">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <PdfToggleButton abierto={verPdf} onToggle={() => setVerPdf((v) => !v)} label="Vista previa PDF" />
          </div>
          {verPdf && <div className="mt-4"><PdfPreviewPanel src={pdfSrc} /></div>}

          {puedeGestionar && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={timbrando}
                onClick={() => {
                  setError(null);
                  setTimbrando(true);
                  startTransition(async () => {
                    const result = await timbrarPagoAction(pago.id);
                    setTimbrando(false);
                    if (result?.error) {
                      setError(result.error);
                      return;
                    }
                    router.refresh();
                  });
                }}
                className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-brand-800 disabled:opacity-70 dark:bg-brand-600 dark:text-brand-950 dark:hover:bg-brand-500"
              >
                {timbrando || isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                Timbrar complemento
              </button>
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
        </Card>

        <Modal open={eliminando} onClose={() => setEliminando(false)} title="Eliminar borrador" size="sm">
          <div className="space-y-5">
            <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <p className="text-sm text-ink">
                Esto elimina el borrador. El saldo de las facturas que iba a liquidar queda disponible de nuevo. Esta
                acción no se puede deshacer.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    await eliminarBorradorPagoAction(pago.id);
                    router.push(`${ROUTES.facturacion}/pagos`);
                    router.refresh();
                  })
                }
                className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-red-700 disabled:opacity-70"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Sí, eliminar
              </button>
              <button type="button" onClick={() => setEliminando(false)} className="rounded-full px-4 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:text-brand-600">
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Card bodyClassName="p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Folio fiscal (UUID)</p>
            <p className="break-all font-mono text-sm font-medium text-ink">{pago.folioFiscal ?? "—"}</p>
          </div>
          <StatusBadge
            tone={pago.estado === "cancelada" ? "danger" : "brand"}
            icon={pago.estado === "cancelada" ? <Ban className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            className="px-3 py-1"
          >
            {pago.estado === "cancelada" ? "Cancelado" : "Timbrado"}
          </StatusBadge>
        </div>

        <div className="mt-5 grid gap-4 border-t border-line pt-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Cliente</p>
            <p className="mt-0.5 text-ink">{pago.receptorNombre ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Monto</p>
            <p className="mt-0.5 font-semibold text-ink">{pago.monto ? formatoMoneda.format(Number(pago.monto)) : "—"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Serie / Folio</p>
            <p className="mt-0.5 text-ink">
              {pago.serie ?? "—"} / {pago.folio ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Fecha de timbrado</p>
            <p className="mt-0.5 text-ink">{pago.fechaTimbrado ?? "—"}</p>
          </div>
        </div>

        {pago.estatusCancelacion && AVISO_CANCELACION[pago.estatusCancelacion] && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-sunrise-400/30 bg-sunrise-300/20 px-3.5 py-3 dark:bg-sunrise-400/10">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-sunrise-500" />
            <div className="flex-1">
              <p className="text-sm text-ink">{AVISO_CANCELACION[pago.estatusCancelacion]}</p>
              {puedeGestionar && pago.estatusCancelacion === "solicitada" && (
                <button
                  type="button"
                  disabled={verificando || isPending}
                  onClick={verificarEstatusCancelacion}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 transition-colors hover:text-brand-800 disabled:opacity-60 dark:text-brand-300 dark:hover:text-brand-200"
                >
                  {verificando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <SearchCheck className="h-3.5 w-3.5" />}
                  Verificar estatus ante el SAT
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <PdfToggleButton abierto={verPdf} onToggle={() => setVerPdf((v) => !v)} label="Ver PDF" variant="primary" />
          <a
            href={`${ROUTES.facturacion}/pagos/${pago.id}/xml`}
            className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-brand-300 hover:text-brand-700 dark:hover:text-brand-300"
          >
            <FileCode2 className="h-4 w-4" />
            Descargar XML
          </a>
          {puedeGestionar && pago.estado === "timbrada" && (
            <button
              type="button"
              onClick={() => setCancelando(true)}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10"
            >
              <Ban className="h-4 w-4" />
              Cancelar complemento
            </button>
          )}
        </div>
      </Card>

      {verPdf && <PdfPreviewPanel src={pdfSrc} />}

      <Card title="Facturas liquidadas" bodyClassName="p-5">
        <div className="overflow-hidden rounded-2xl border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-cloud/40 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                <th className="px-4 py-2.5">Folio fiscal</th>
                <th className="px-4 py-2.5 text-center">Parc.</th>
                <th className="px-4 py-2.5 text-right">Saldo anterior</th>
                <th className="px-4 py-2.5 text-right">Pagado</th>
                <th className="px-4 py-2.5 text-right">Saldo insoluto</th>
              </tr>
            </thead>
            <tbody>
              {pago.documentosDetalle.map((d, i) => (
                <tr key={i} className="border-b border-line/60 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs font-medium text-ink">{d.folioFiscal ?? "—"}</p>
                    <p className="text-xs text-muted">{d.serieFolio}</p>
                  </td>
                  <td className="px-4 py-3 text-center text-ink-soft">{d.parcialidad ?? "1"}</td>
                  <td className="px-4 py-3 text-right text-ink-soft">{formatoMoneda.format(d.impSaldoAnt)}</td>
                  <td className="px-4 py-3 text-right font-medium text-ink">{formatoMoneda.format(d.impPagado)}</td>
                  <td className="px-4 py-3 text-right text-ink-soft">{formatoMoneda.format(d.impSaldoInsoluto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <CancelarPagoModal open={cancelando} idPago={pago.id} onClose={() => setCancelando(false)} />
    </div>
  );
}
