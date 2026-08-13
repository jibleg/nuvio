"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ROUTES } from "@/config/routes";
import { recurrirFacturaAction } from "../actions";

export function RecurrirFacturaModal({
  open,
  idFactura,
  onClose,
}: {
  open: boolean;
  idFactura: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Recurrir factura"
      size="sm"
      hero={
        <div className="bg-linear-to-br from-brand-600 to-brand-800 px-6 py-7">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25">
              <RefreshCw className="h-5 w-5 text-white" />
            </span>
            <div className="min-w-0 pr-10">
              <p className="font-display text-lg font-bold text-white">Recurrir factura</p>
              <p className="mt-0.5 text-sm text-white/75">Crea una nueva factura para el siguiente periodo</p>
            </div>
          </div>
          <div className="mt-5 h-1 rounded-full bg-aurora-400/70" />
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-ink">
          Se creará una nueva factura independiente, con los mismos datos (emisor, receptor y conceptos) que esta, lista para timbrarse en el siguiente periodo.
        </p>

        {error && (
          <p className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-sm font-medium text-red-500">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        <div className="flex items-center gap-3 border-t border-line pt-4">
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                const result = await recurrirFacturaAction(idFactura);
                if (!result.ok) {
                  setError(result.error);
                  return;
                }
                router.push(`${ROUTES.facturacion}/${result.id}`);
                router.refresh();
              });
            }}
            className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-brand-800 disabled:opacity-70 dark:bg-brand-600 dark:text-brand-950 dark:hover:bg-brand-500"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Sí, recurrir
          </button>
          <button type="button" onClick={onClose} className="rounded-full px-4 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:text-brand-600">
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}
