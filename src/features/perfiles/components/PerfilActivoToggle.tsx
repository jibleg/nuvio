"use client";

import { useState, useTransition } from "react";
import { togglePerfilActivoAction } from "../actions";

export function PerfilActivoToggle({
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
      const result = await togglePerfilActivoAction(id, !activo);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={activo ? "Desactivar perfil" : "Activar perfil"}
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
  );
}
