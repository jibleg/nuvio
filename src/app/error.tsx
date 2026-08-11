"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/config/routes";

/**
 * Error boundary global (`src/app/error.tsx`): atrapa cualquier error de
 * render que no tenga un `error.tsx` más específico por debajo. Client
 * Component obligatorio (Next.js no permite `metadata` aquí). No es
 * `global-error.tsx` — ese solo entra si el propio `RootLayout` truena.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-24 text-center">
      <Logo href="/" size="lg" className="mb-10" />

      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-red-500/10 text-red-500">
        <AlertTriangle className="h-8 w-8" />
      </span>

      <h1 className="mt-6 font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
        Algo salió mal
      </h1>
      <p className="mt-3 max-w-md text-pretty text-base leading-relaxed text-muted">
        No pudimos cargar esta página. Intenta de nuevo — si el problema sigue, vuelve al inicio.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-700 px-6 py-3 text-[0.95rem] font-semibold text-white shadow-glow transition-colors hover:bg-brand-800 dark:bg-brand-600 dark:text-brand-950 dark:hover:bg-brand-500"
        >
          <RotateCcw className="h-4 w-4" />
          Reintentar
        </button>
        <Button href={ROUTES.home} variant="secondary">
          Volver al inicio
        </Button>
      </div>
    </div>
  );
}
