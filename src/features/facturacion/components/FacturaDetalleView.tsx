"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  Ban,
  Banknote,
  CheckCircle2,
  FileCode2,
  FileText,
  Loader2,
  Mail,
  RefreshCw,
  Repeat,
  SearchCheck,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ROUTES } from "@/config/routes";
import { notifyError, notifySuccess } from "@/lib/toast";
import { eliminarBorradorAction, recurrirFacturaAction, refacturarAction, verificarEstatusCancelacionAction } from "../actions";
import type { FacturaDetalle, FacturaResumenRelacion, PagoAplicado } from "../types";
import { CancelarFacturaModal } from "./CancelarFacturaModal";
import { EnviarCorreoModal } from "./EnviarCorreoModal";
import { FacturaForm } from "./FacturaForm";
import { PdfPreviewPanel, PdfToggleButton } from "./PdfViewer";

const AVISO_CANCELACION: Record<string, string> = {
  solicitada: "Cancelación en proceso: pendiente de que el receptor la acepte o rechace (o venzan 72 h).",
  rechazada: "El receptor rechazó una solicitud de cancelación previa. La factura sigue vigente.",
  plazo_vencido: "Venció el plazo de una solicitud de cancelación anterior sin respuesta. La factura sigue vigente.",
};

const formatoMoneda = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

function BannerSustituye({ facturaOriginal }: { facturaOriginal: FacturaResumenRelacion }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-brand-200 bg-brand-50/60 px-3.5 py-3 dark:border-brand-800 dark:bg-brand-900/20">
      <Repeat className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
      <p className="text-sm text-ink">
        Sustituye al folio fiscal{" "}
        <Link href={`${ROUTES.facturacion}/${facturaOriginal.id}`} className="font-mono font-medium text-brand-700 hover:underline dark:text-brand-300">
          {facturaOriginal.folioFiscal}
        </Link>
        .
      </p>
    </div>
  );
}

export function FacturaDetalleView({
  factura,
  puedeGestionar,
  saldoPendiente = null,
  pagosAplicados = [],
  facturaOriginal = null,
  sustitutoTimbrado = null,
}: {
  factura: FacturaDetalle;
  puedeGestionar: boolean;
  /** `null` si la factura no es PPD o no está timbrada; un número (0 incluido) si aplica. */
  saldoPendiente?: number | null;
  pagosAplicados?: PagoAplicado[];
  /** La factura a la que esta sustituye, si `factura.cfdiRelacionado` está resuelto. */
  facturaOriginal?: FacturaResumenRelacion | null;
  /** El sustituto YA TIMBRADO de esta factura, si ya se refacturó y timbró (habilita cancelar con motivo 01). */
  sustitutoTimbrado?: FacturaResumenRelacion | null;
}) {
  const router = useRouter();
  const [eliminando, setEliminando] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [enviandoCorreo, setEnviandoCorreo] = useState(false);
  const [refacturando, setRefacturando] = useState(false);
  const [errorRefacturar, setErrorRefacturar] = useState<string | null>(null);
  const [recurriendo, setRecurriendo] = useState(false);
  const [errorRecurrir, setErrorRecurrir] = useState<string | null>(null);
  const [verificando, setVerificando] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [verPdf, setVerPdf] = useState(false);
  const pdfSrc = `${ROUTES.facturacion}/${factura.id}/pdf`;

  const verificarEstatusCancelacion = () => {
    setVerificando(true);
    startTransition(async () => {
      const result = await verificarEstatusCancelacionAction(factura.id);
      setVerificando(false);
      if (!result.ok) {
        notifyError(result.error);
        return;
      }
      notifySuccess(result.mensaje);
      router.refresh();
    });
  };

  const refacturar = () => {
    setErrorRefacturar(null);
    setRefacturando(true);
    startTransition(async () => {
      const result = await refacturarAction(factura.id);
      setRefacturando(false);
      if (!result.ok) {
        setErrorRefacturar(result.error);
        return;
      }
      router.push(`${ROUTES.facturacion}/${result.id}`);
      router.refresh();
    });
  };

  const recurrir = () => {
    setErrorRecurrir(null);
    setRecurriendo(true);
    startTransition(async () => {
      const result = await recurrirFacturaAction(factura.id);
      setRecurriendo(false);
      if (!result.ok) {
        setErrorRecurrir(result.error);
        return;
      }
      router.push(`${ROUTES.facturacion}/${result.id}`);
      router.refresh();
    });
  };

  if (factura.estado === "borrador") {
    return (
      <div className="space-y-5">
        {facturaOriginal && <BannerSustituye facturaOriginal={facturaOriginal} />}
        <FacturaForm mode="edit" initial={factura} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PdfToggleButton abierto={verPdf} onToggle={() => setVerPdf((v) => !v)} label="Vista previa PDF" />
          {puedeGestionar && (
            <button
              type="button"
              onClick={() => setEliminando(true)}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar borrador
            </button>
          )}
        </div>
        {verPdf && <PdfPreviewPanel src={pdfSrc} />}
        <EliminarBorradorModal open={eliminando} idFactura={factura.id} onClose={() => setEliminando(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Card bodyClassName="p-6">
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
          <StatusBadge
            tone={factura.estado === "cancelada" ? "danger" : "brand"}
            icon={factura.estado === "cancelada" ? <Ban className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            className="px-3 py-1"
          >
            {factura.estado === "cancelada" ? "Cancelada" : "Timbrada"}
          </StatusBadge>
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
            <div className="flex-1">
              <p className="text-sm text-ink">{AVISO_CANCELACION[factura.estatusCancelacion]}</p>
              {puedeGestionar && factura.estatusCancelacion === "solicitada" && (
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

        {facturaOriginal && <div className="mt-4"><BannerSustituye facturaOriginal={facturaOriginal} /></div>}

        {sustitutoTimbrado && factura.estado === "timbrada" && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-sunrise-400/30 bg-sunrise-300/20 px-3.5 py-3 dark:bg-sunrise-400/10">
            <Repeat className="mt-0.5 h-4 w-4 shrink-0 text-sunrise-500" />
            <p className="text-sm text-ink">
              Ya existe un sustituto timbrado ({" "}
              <Link href={`${ROUTES.facturacion}/${sustitutoTimbrado.id}`} className="font-mono font-medium text-brand-700 hover:underline dark:text-brand-300">
                {sustitutoTimbrado.folioFiscal}
              </Link>
              {" "}). Puedes cancelar esta factura con el motivo de sustitución.
            </p>
          </div>
        )}

        {errorRefacturar && (
          <p className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-sm font-medium text-red-500">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {errorRefacturar}
          </p>
        )}

        {errorRecurrir && (
          <p className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-sm font-medium text-red-500">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {errorRecurrir}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <PdfToggleButton abierto={verPdf} onToggle={() => setVerPdf((v) => !v)} label="Ver PDF" variant="primary" />
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
          {puedeGestionar && factura.estado === "timbrada" && !sustitutoTimbrado && (
            <button
              type="button"
              disabled={refacturando || isPending}
              onClick={refacturar}
              className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-brand-300 hover:text-brand-700 disabled:opacity-70 dark:hover:text-brand-300"
            >
              {refacturando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Repeat className="h-4 w-4" />}
              Refacturar
            </button>
          )}
          {puedeGestionar && factura.estado === "timbrada" && (
            <button
              type="button"
              disabled={recurriendo || isPending}
              onClick={recurrir}
              title="Crea una nueva factura independiente con los mismos datos, para el siguiente periodo"
              className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-brand-300 hover:text-brand-700 disabled:opacity-70 dark:hover:text-brand-300"
            >
              {recurriendo ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Recurrir factura
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
      </Card>

      {verPdf && <PdfPreviewPanel src={pdfSrc} />}

      {saldoPendiente !== null && (
        <Card bodyClassName="p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span aria-hidden className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-sunrise-300 to-sunrise-500 text-white">
                <Banknote className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Saldo pendiente</p>
                <p className="mt-0.5 font-display text-xl font-bold text-ink">{formatoMoneda.format(saldoPendiente)}</p>
              </div>
            </div>
            {puedeGestionar && saldoPendiente > 0 && (
              <Link
                href={`${ROUTES.facturacion}/pagos/nuevo?contacto=${factura.idContactoFacturacion}`}
                className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-brand-800 dark:bg-brand-600 dark:text-brand-950 dark:hover:bg-brand-500"
              >
                <Banknote className="h-4 w-4" />
                Registrar pago
              </Link>
            )}
          </div>

          {pagosAplicados.length > 0 && (
            <div className="mt-4 divide-y divide-line border-t border-line">
              {pagosAplicados.map((p) => (
                <Link
                  key={p.idPago}
                  href={`${ROUTES.facturacion}/pagos/${p.idPago}`}
                  className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-brand-700 dark:hover:text-brand-300"
                >
                  <span className="font-mono text-xs text-muted">{p.folioFiscal}</span>
                  <span className="text-muted">{p.fechaPago}</span>
                  <span className="font-medium text-ink">{formatoMoneda.format(p.impPagado)}</span>
                </Link>
              ))}
            </div>
          )}
        </Card>
      )}

      <Card title="Conceptos" bodyClassName="p-5">
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
      </Card>

      <CancelarFacturaModal
        open={cancelando}
        idFactura={factura.id}
        onClose={() => setCancelando(false)}
        motivoInicial={sustitutoTimbrado ? "01" : "02"}
        folioSustitucionInicial={sustitutoTimbrado?.folioFiscal ?? ""}
      />
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
                router.push(`${ROUTES.facturacion}/consultar`);
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
