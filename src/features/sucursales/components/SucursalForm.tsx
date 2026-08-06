"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, Loader2, MapPin, Save } from "lucide-react";
import { createSucursalAction, listRegimenesFiscalesAction, updateSucursalAction } from "../actions";
import type { SucursalDetalle } from "../types";
import { CsdUploader } from "@/features/csd";
import { LogoUploader } from "./LogoUploader";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import type { CatalogoItem } from "@/lib/cfdi/catalogos";

const inputClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-all placeholder:text-muted focus:border-brand-400 focus:ring-4 focus:ring-brand-400/20";
const labelClass = "mb-1.5 block text-sm font-semibold text-ink-soft";

/**
 * Schema local para feedback inmediato en el form (strings tal como los
 * produce el DOM). El schema autoritativo con las transformaciones (código
 * postal a número, etc.) vive en `../schemas.ts` y corre en el servidor.
 *
 * `esMatriz` cambia solo el mensaje y la obligatoriedad de razón social/RFC:
 * la matriz siempre los requiere (no hay a quién heredarle), una sucursal
 * solo cuando activa el toggle "razón social propia".
 */
function buildClientSchema(esMatriz: boolean) {
  return z
    .object({
      nombreComercial: z.string().trim().min(1, "Requerido"),
      nombreCorto: z.string().trim(),
      usaFiscalPropio: z.boolean(),
      razonSocialPropia: z.string().trim(),
      rfcPropio: z
        .string()
        .trim()
        .toUpperCase()
        .refine((v) => /^[A-Z0-9]*$/.test(v), "Solo letras y números"),
      idRegimen: z.string(),
      calle: z.string().trim(),
      colonia: z.string().trim(),
      ciudad: z.string().trim(),
      codigoPostal: z
        .string()
        .trim()
        .refine((v) => v === "" || /^\d{5}$/.test(v), "5 dígitos"),
      telefono: z.string().trim(),
      email: z.union([z.literal(""), z.string().trim().toLowerCase().pipe(z.email("Correo inválido"))]),
    })
    .refine(
      (data) =>
        !(esMatriz || data.usaFiscalPropio) ||
        (data.razonSocialPropia.trim() && data.rfcPropio.trim() && data.idRegimen && data.codigoPostal.trim()),
      {
        message: esMatriz
          ? "Captura la razón social, el RFC, el régimen fiscal y el código postal de la empresa"
          : "Captura razón social, RFC, régimen fiscal y código postal propios, o desactiva \"Razón social propia\"",
        path: ["razonSocialPropia"],
      },
    );
}
type FormValues = z.infer<ReturnType<typeof buildClientSchema>>;

export function SucursalForm({
  mode,
  initial,
  onSuccess,
  onCancel,
}: {
  mode: "create" | "edit";
  initial?: SucursalDetalle;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const esMatriz = initial?.esMatriz ?? false;
  const clientSchema = useMemo(() => buildClientSchema(esMatriz), [esMatriz]);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      nombreComercial: initial?.nombreComercial ?? "",
      nombreCorto: initial?.nombreCorto ?? "",
      // La matriz siempre "usa" sus propios datos fiscales (no hereda de nadie);
      // en sucursales el toggle real lo decide el usuario.
      usaFiscalPropio: esMatriz || (initial?.esFiscalPropio ?? false),
      razonSocialPropia: initial?.razonSocialPropia ?? "",
      rfcPropio: initial?.rfcPropio ?? "",
      idRegimen: initial?.idRegimenPropio ? String(initial.idRegimenPropio) : "",
      calle: initial?.calle ?? "",
      colonia: initial?.colonia ?? "",
      ciudad: initial?.ciudad ?? "",
      codigoPostal: initial?.codigoPostal ? String(initial.codigoPostal) : "",
      telefono: initial?.telefono ?? "",
      email: initial?.email ?? "",
    },
  });
  const usaFiscalPropio = watch("usaFiscalPropio");
  const idRegimenValue = watch("idRegimen");
  const [activo, setActivo] = useState(initial?.activo ?? true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [regimenes, setRegimenes] = useState<CatalogoItem[]>([]);

  useEffect(() => {
    listRegimenesFiscalesAction().then(setRegimenes);
  }, []);
  const [isPending, startTransition] = useTransition();

  const onValid = (values: FormValues) => {
    setServerError(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createSucursalAction(values)
          : await updateSucursalAction(initial!.id, { ...values, activo });
      if (result?.error) {
        setServerError(result.error);
        return;
      }
      onSuccess();
    });
  };

  return (
    <form onSubmit={handleSubmit(onValid)} className="space-y-5" noValidate>
      {esMatriz ? (
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-soft">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
            <div>
              <span className={labelClass}>Datos fiscales</span>
              <p className="text-xs text-muted">
                Razón social, RFC y código postal de la empresa. Las sucursales sin datos propios facturan con
                estos.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Razón social" error={errors.razonSocialPropia?.message}>
                <input className={inputClass} {...register("razonSocialPropia")} />
              </Field>
            </div>
            <Field label="RFC" error={errors.rfcPropio?.message}>
              <input
                className={inputClass}
                maxLength={13}
                style={{ textTransform: "uppercase" }}
                {...register("rfcPropio")}
              />
            </Field>
            <Field label="Régimen fiscal" error={errors.idRegimen?.message}>
              <SearchableSelect
                value={idRegimenValue}
                onChange={(v) => setValue("idRegimen", v, { shouldValidate: true })}
                searchPlaceholder="Buscar régimen fiscal…"
                options={regimenes.map((r) => ({ value: String(r.id), label: r.clave, sublabel: r.descripcion ?? undefined }))}
              />
            </Field>
            <Field label="Código postal" error={errors.codigoPostal?.message}>
              <input
                className={inputClass}
                placeholder="86000"
                inputMode="numeric"
                maxLength={5}
                {...register("codigoPostal")}
              />
            </Field>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className={labelClass}>Razón social propia</span>
              <p className="text-xs text-muted">
                Por defecto la sucursal factura con los datos de la matriz
                {initial ? `: ${initial.razonSocialEfectiva ?? "—"} · ${initial.rfcEfectivo ?? "—"}` : ""}. Actívalo
                solo si esta sucursal factura con un RFC y certificado (CSD) distintos.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={usaFiscalPropio}
              aria-label="Usar razón social propia"
              onClick={() => setValue("usaFiscalPropio", !usaFiscalPropio, { shouldValidate: true })}
              className="mt-0.5 shrink-0"
            >
              <span
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${usaFiscalPropio ? "bg-brand-500" : "bg-line"}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${usaFiscalPropio ? "translate-x-6" : "translate-x-1"}`}
                />
              </span>
            </button>
          </div>

          {usaFiscalPropio && (
            <div className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Razón social" error={errors.razonSocialPropia?.message}>
                  <input className={inputClass} {...register("razonSocialPropia")} />
                </Field>
              </div>
              <Field label="RFC" error={errors.rfcPropio?.message}>
                <input
                  className={inputClass}
                  maxLength={13}
                  style={{ textTransform: "uppercase" }}
                  {...register("rfcPropio")}
                />
              </Field>
              <Field label="Régimen fiscal" error={errors.idRegimen?.message}>
                <SearchableSelect
                  value={idRegimenValue}
                  onChange={(v) => setValue("idRegimen", v, { shouldValidate: true })}
                  searchPlaceholder="Buscar régimen fiscal…"
                  options={regimenes.map((r) => ({ value: String(r.id), label: r.clave, sublabel: r.descripcion ?? undefined }))}
                />
              </Field>
              <Field label="Código postal" error={errors.codigoPostal?.message}>
                <input
                  className={inputClass}
                  placeholder="86000"
                  inputMode="numeric"
                  maxLength={5}
                  {...register("codigoPostal")}
                />
              </Field>
            </div>
          )}
        </div>
      )}

      {mode === "edit" && initial && (esMatriz || initial.esFiscalPropio) && initial.rfcEfectivo && (
        <>
          <LogoUploader idEmpresa={initial.id} />
          <CsdUploader idEmpresa={initial.id} rfcEmpresa={initial.rfcEfectivo} />
        </>
      )}

      <div className="rounded-2xl border border-line bg-surface p-5 shadow-soft">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre comercial" error={errors.nombreComercial?.message}>
            <input
              className={inputClass}
              placeholder="Ej. Sucursal Centro"
              {...register("nombreComercial")}
            />
          </Field>
          <Field label="Nombre corto">
            <input className={inputClass} placeholder="Centro" {...register("nombreCorto")} />
          </Field>
          <Field label="Calle y número">
            <input className={inputClass} {...register("calle")} />
          </Field>
          <Field label="Colonia">
            <input className={inputClass} {...register("colonia")} />
          </Field>
          <Field label="Ciudad">
            <input className={inputClass} {...register("ciudad")} />
          </Field>
          {!esMatriz && !usaFiscalPropio && (
            <Field label="Código postal" error={errors.codigoPostal?.message}>
              <input
                className={inputClass}
                placeholder="86000"
                inputMode="numeric"
                maxLength={5}
                {...register("codigoPostal")}
              />
            </Field>
          )}
          <Field label="Teléfono">
            <input className={inputClass} {...register("telefono")} />
          </Field>
          <Field label="Correo" error={errors.email?.message}>
            <input className={inputClass} type="email" {...register("email")} />
          </Field>
        </div>

        {mode === "edit" && !esMatriz && (
          <div className="mt-4">
            <span className={labelClass}>Estado</span>
            <button
              type="button"
              role="switch"
              aria-checked={activo}
              onClick={() => setActivo((v) => !v)}
              className="flex items-center gap-3 text-sm font-medium text-ink"
            >
              <span
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${activo ? "bg-brand-500" : "bg-line"}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${activo ? "translate-x-6" : "translate-x-1"}`}
                />
              </span>
              {activo ? "Sucursal activa" : "Sucursal inactiva"}
            </button>
          </div>
        )}
      </div>

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
          {mode === "create" ? "Crear sucursal" : "Guardar cambios"}
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

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className={labelClass}>{label}</span>
      {children}
      {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
    </div>
  );
}
