"use client";

import { useState, useTransition } from "react";
import { toggleUsuarioActivoAction } from "../actions";

export function UsuarioActivoToggle({
  id,
  activo,
}: {
  id: number;
  activo: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onToggle = () => {
    setError(null);
    startTransition(async () => {
      const result = await toggleUsuarioActivoAction(id, !activo);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        role="switch"
        aria-checked={activo}
        aria-label={activo ? "Desactivar usuario" : "Activar usuario"}
        onClick={onToggle}
        disabled={isPending}
        title={error ?? undefined}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${
          activo ? "bg-brand-500" : "bg-line"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            activo ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
