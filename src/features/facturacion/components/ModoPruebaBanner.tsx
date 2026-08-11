import { FlaskConical } from "lucide-react";

/**
 * Aviso persistente del módulo Facturación mientras la empresa activa
 * factura en sandbox (por gate de cuenta o por toggle de la sucursal, ver
 * `timbrar-factura.ts`) — para que nadie confunda una factura de prueba con
 * una real. Debajo del `DashboardHeader` (`sticky top-16`, header mide 64px).
 */
export function ModoPruebaBanner() {
  return (
    <div className="sticky top-16 z-30 border-b border-amber-300 bg-amber-100/95 backdrop-blur-sm dark:border-amber-800 dark:bg-amber-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-2 text-center">
        <FlaskConical className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" />
        <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 sm:text-sm">
          Modo de prueba — este módulo está timbrando en ambiente sandbox; los documentos generados no tienen validez fiscal.
        </p>
      </div>
    </div>
  );
}
