"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, Save } from "lucide-react";
import { createPermisoSchema } from "../schemas";
import { createPermisoAction, updatePermisoAction } from "../actions";
import type { ModuloOption, PermisoDetalle } from "../types";

const SIN_MODULO = -1;

const inputClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-all placeholder:text-muted focus:border-brand-400 focus:ring-4 focus:ring-brand-400/20";
const labelClass = "mb-1.5 block text-sm font-semibold text-ink-soft";

type FormValues = { nombre: string; codigo: string; idModulo: number };

export function PermisoForm({
  mode,
  modulos,
  initial,
  onSuccess,
  onCancel,
}: {
  mode: "create" | "edit";
  modulos: ModuloOption[];
  initial?: PermisoDetalle;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createPermisoSchema),
    defaultValues: {
      nombre: initial?.nombre ?? "",
      codigo: initial?.codigo ?? "",
      idModulo: initial?.idModulo ?? SIN_MODULO,
    },
  });
  const [activo, setActivo] = useState(initial?.activo ?? true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (values: FormValues) => {
    setServerError(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createPermisoAction(values)
          : await updatePermisoAction(initial!.id, { ...values, activo });
      if (result?.error) {
        setServerError(result.error);
        return;
      }
      onSuccess();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div>
        <label htmlFor="nombre" className={labelClass}>
          Nombre
        </label>
        <input id="nombre" className={inputClass} placeholder="Consulta de facturas" {...register("nombre")} />
        {errors.nombre && <p className="mt-1.5 text-sm text-red-500">{errors.nombre.message}</p>}
      </div>

      <div>
        <label htmlFor="codigo" className={labelClass}>
          Código
        </label>
        <input id="codigo" className={`${inputClass} font-mono`} placeholder="facturas.consulta" {...register("codigo")} />
        {errors.codigo && <p className="mt-1.5 text-sm text-red-500">{errors.codigo.message}</p>}
        <p className="mt-1.5 text-xs text-muted">
          Llave que usa el sistema para autorizar. No la cambies si ya está en uso.
        </p>
      </div>

      <div>
        <label htmlFor="idModulo" className={labelClass}>
          Módulo
        </label>
        <select
          id="idModulo"
          className={inputClass}
          {...register("idModulo", { valueAsNumber: true })}
        >
          <option value={SIN_MODULO}>Sin módulo</option>
          {modulos.map((modulo) => (
            <option key={modulo.id} value={modulo.id}>
              {modulo.nombre}
            </option>
          ))}
        </select>
      </div>

      {mode === "edit" && (
        <button
          type="button"
          role="switch"
          aria-checked={activo}
          onClick={() => setActivo((v) => !v)}
          className="flex items-center gap-3 text-sm font-medium text-ink"
        >
          <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${activo ? "bg-brand-500" : "bg-line"}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${activo ? "translate-x-6" : "translate-x-1"}`} />
          </span>
          {activo ? "Permiso activo" : "Permiso inactivo"}
        </button>
      )}

      {serverError && (
        <p className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-sm font-medium text-red-500">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {serverError}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-brand-800 disabled:opacity-70 dark:bg-brand-600 dark:text-brand-950 dark:hover:bg-brand-500"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {mode === "create" ? "Crear permiso" : "Guardar cambios"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full px-4 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:text-brand-600"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
