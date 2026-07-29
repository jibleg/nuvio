"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, Check, Loader2, Save } from "lucide-react";
import { createPerfilAction, updatePerfilAction } from "../actions";
import type { PerfilDetalle, PerfilFormOptions } from "../types";

const schema = z.object({
  nombre: z.string().trim().min(1, "Requerido"),
  descripcion: z.string(),
});
type FormValues = z.infer<typeof schema>;

const inputClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-all placeholder:text-muted focus:border-brand-400 focus:ring-4 focus:ring-brand-400/20";
const labelClass = "mb-1.5 block text-sm font-semibold text-ink-soft";

export function PerfilForm({
  mode,
  options,
  initial,
  onSuccess,
  onCancel,
}: {
  mode: "create" | "edit";
  options: PerfilFormOptions;
  initial?: PerfilDetalle;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: initial?.nombre ?? "",
      descripcion: initial?.descripcion ?? "",
    },
  });
  const [permisoIds, setPermisoIds] = useState<number[]>(
    initial?.permisoIds ?? [],
  );
  const [activo, setActivo] = useState(initial?.activo ?? true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const togglePermiso = (id: number) => {
    setPermisoIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleModulo = (ids: number[], todosPuestos: boolean) => {
    setPermisoIds((prev) =>
      todosPuestos
        ? prev.filter((id) => !ids.includes(id))
        : [...new Set([...prev, ...ids])],
    );
  };

  const onSubmit = (values: FormValues) => {
    setServerError(null);
    startTransition(async () => {
      const payload = {
        nombre: values.nombre,
        descripcion: values.descripcion,
        permisos: permisoIds,
      };
      const result =
        mode === "create"
          ? await createPerfilAction(payload)
          : await updatePerfilAction(initial!.id, { ...payload, activo });
      if (result?.error) {
        setServerError(result.error);
        return;
      }
      onSuccess();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="grid gap-4 rounded-2xl border border-line bg-surface p-5 shadow-soft sm:grid-cols-2">
        <div>
          <label htmlFor="nombre" className={labelClass}>
            Nombre del perfil
          </label>
          <input id="nombre" className={inputClass} placeholder="Facturador" {...register("nombre")} />
          {errors.nombre && <p className="mt-1.5 text-sm text-red-500">{errors.nombre.message}</p>}
        </div>
        <div>
          <label htmlFor="descripcion" className={labelClass}>
            Descripción (opcional)
          </label>
          <input id="descripcion" className={inputClass} placeholder="Qué puede hacer este rol" {...register("descripcion")} />
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold text-ink">Permisos del perfil</h2>
          <span className="text-xs text-muted">{permisoIds.length} seleccionados</span>
        </div>
        <div className="space-y-4">
          {options.permisos.map((grupo) => {
            const ids = grupo.permisos.map((p) => p.id);
            const todosPuestos = ids.every((id) => permisoIds.includes(id));
            return (
              <fieldset key={grupo.moduloId} className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
                <div className="mb-3 flex items-center justify-between">
                  <legend className="text-xs font-bold uppercase tracking-wide text-brand-700 dark:text-brand-300">
                    {grupo.moduloNombre}
                  </legend>
                  <button
                    type="button"
                    onClick={() => toggleModulo(ids, todosPuestos)}
                    className="text-xs font-semibold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-300"
                  >
                    {todosPuestos ? "Quitar todo" : "Seleccionar todo"}
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {grupo.permisos.map((permiso) => {
                    const activoPermiso = permisoIds.includes(permiso.id);
                    return (
                      <button
                        key={permiso.id}
                        type="button"
                        aria-pressed={activoPermiso}
                        onClick={() => togglePermiso(permiso.id)}
                        className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                          activoPermiso
                            ? "border-brand-400 bg-brand-50 text-brand-700 dark:text-brand-200"
                            : "border-line text-ink-soft hover:border-brand-300"
                        }`}
                      >
                        <span
                          className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${
                            activoPermiso ? "border-brand-500 bg-brand-500 text-white" : "border-line"
                          }`}
                        >
                          {activoPermiso && <Check className="h-3 w-3" strokeWidth={3} />}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{permiso.nombre}</span>
                          {permiso.codigo && (
                            <code className="block truncate text-xs text-muted">{permiso.codigo}</code>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}
        </div>
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
          {activo ? "Perfil activo" : "Perfil inactivo"}
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
          {mode === "create" ? "Crear perfil" : "Guardar cambios"}
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
