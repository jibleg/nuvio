"use client";

import { useState, useTransition } from "react";
import { togglePermisoActivoAction } from "../actions";

export function PermisoActivoToggle({
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
      const result = await togglePermisoActivoAction(id, !activo);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={activo ? "Desactivar permiso" : "Activar permiso"}
      onClick={onToggle}
      disabled={isPending}
      title={error ?? undefined}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${
        activo ? "bg-brand-500" : "bg-line"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          activo ? "translate-x-[1.15rem]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
