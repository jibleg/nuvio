"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, ImageIcon, KeyRound, Landmark, Loader2, MapPin, Save } from "lucide-react";
import { createSucursalAction, listRegimenesFiscalesAction, updateSucursalAction } from "../actions";
import type { SucursalDetalle } from "../types";
import { CsdUploader } from "@/features/csd";
import { AmbienteFacturacionToggle } from "./AmbienteFacturacionToggle";
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
      serie: z
        .string()
        .trim()
        .toUpperCase()
        .max(5, "Máximo 5 caracteres")
        .refine((v) => /^[A-Z0-9]*$/.test(v), "Solo letras y números"),
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

const TAB_FISCAL = "fiscal" as const;
const TAB_CERTIFICADO = "certificado" as const;
const TAB_LOGO = "logo" as const;
const TAB_DIRECCION = "direccion" as const;
type TabId = typeof TAB_FISCAL | typeof TAB_CERTIFICADO | typeof TAB_LOGO | typeof TAB_DIRECCION;

export function SucursalForm({
  mode,
  initial,
  ambienteCuenta,
  onSuccess,
  onCancel,
}: {
  mode: "create" | "edit";
  initial?: SucursalDetalle;
  /** Ambiente de Finkok aprobado por Nuvio para la cuenta — gate del toggle de ambiente por sucursal. */
  ambienteCuenta: "sandbox" | "produccion";
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
      serie: initial?.serie ?? "",
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
  const [csdPendiente, setCsdPendiente] = useState(false);

  useEffect(() => {
    listRegimenesFiscalesAction().then(setRegimenes);
  }, []);
  const [isPending, startTransition] = useTransition();

  // El CSD/logo/ambiente necesitan un `idEmpresa` ya existente y una identidad
  // fiscal propia — no aplican al crear, ni a una sucursal que hereda de la
  // matriz. Usa `initial.esFiscalPropio` (el valor con el que se abrió el
  // modal), no el toggle en vivo: activar "razón social propia" y guardar
  // primero es lo que habilita estas tabs, igual que antes de tener tabs.
  const gestionEmpresaDisponible = Boolean(
    mode === "edit" && initial && (esMatriz || initial.esFiscalPropio) && initial.rfcEfectivo,
  );

  const codigoPostalEsFiscal = esMatriz || usaFiscalPropio;

  const TABS = useMemo(
    () =>
      [
        { id: TAB_FISCAL, label: "Datos fiscales", icon: Landmark },
        ...(gestionEmpresaDisponible
          ? [
              { id: TAB_CERTIFICADO, label: "Certificado", icon: KeyRound },
              { id: TAB_LOGO, label: "Logo", icon: ImageIcon },
            ]
          : []),
        { id: TAB_DIRECCION, label: "Dirección", icon: MapPin },
      ] as const,
    [gestionEmpresaDisponible],
  );
  const [activeTab, setActiveTab] = useState<TabId>(TAB_FISCAL);

  const fiscalTieneError = Boolean(
    errors.razonSocialPropia ||
      errors.rfcPropio ||
      errors.idRegimen ||
      errors.serie ||
      (codigoPostalEsFiscal && errors.codigoPostal),
  );
  const direccionTieneError = Boolean(
    errors.nombreComercial || errors.email || (!codigoPostalEsFiscal && errors.codigoPostal),
  );

  const onInvalid = (formErrors: FieldErrors<FormValues>) => {
    if (formErrors.razonSocialPropia || formErrors.rfcPropio || formErrors.serie) {
      setActiveTab(TAB_FISCAL);
    } else if (formErrors.codigoPostal) {
      setActiveTab(codigoPostalEsFiscal ? TAB_FISCAL : TAB_DIRECCION);
    } else if (formErrors.nombreComercial || formErrors.email) {
      setActiveTab(TAB_DIRECCION);
    }
  };

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
    <form onSubmit={handleSubmit(onValid, onInvalid)} className="space-y-5" noValidate>
      <div className="flex gap-1 overflow-x-auto rounded-full border border-line bg-cloud/50 p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          const hasError = (tab.id === TAB_FISCAL && fiscalTieneError) || (tab.id === TAB_DIRECCION && direccionTieneError);
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                active ? "bg-surface text-brand-700 shadow-soft dark:text-brand-200" : "text-ink-soft hover:text-ink"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {hasError && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />}
            </button>
          );
        })}
      </div>

      <div className="min-h-125">
        {activeTab === TAB_FISCAL &&
          (esMatriz ? (
            <div className="rounded-2xl border border-line bg-surface p-5 shadow-soft">
              <div className="flex items-start gap-2">
                <Landmark className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
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
                <Field label="Serie del CFDI" error={errors.serie?.message}>
                  <input
                    className={inputClass}
                    placeholder="A"
                    maxLength={5}
                    style={{ textTransform: "uppercase" }}
                    {...register("serie")}
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
                  <Field label="Serie del CFDI" error={errors.serie?.message}>
                    <input
                      className={inputClass}
                      placeholder="A"
                      maxLength={5}
                      style={{ textTransform: "uppercase" }}
                      {...register("serie")}
                    />
                  </Field>
                </div>
              )}
            </div>
          ))}

        {activeTab === TAB_CERTIFICADO && gestionEmpresaDisponible && initial && (
          <div className="space-y-5">
            <CsdUploader idEmpresa={initial.id} rfcEmpresa={initial.rfcEfectivo!} onDirtyChange={setCsdPendiente} />
            <AmbienteFacturacionToggle
              idEmpresa={initial.id}
              ambiente={initial.ambienteTimbrado}
              ambienteCuenta={ambienteCuenta}
            />
          </div>
        )}

        {activeTab === TAB_LOGO && gestionEmpresaDisponible && initial && <LogoUploader idEmpresa={initial.id} />}

        {activeTab === TAB_DIRECCION && (
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
              {!codigoPostalEsFiscal && (
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
              <div className="mt-4 border-t border-line pt-4">
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
        )}
      </div>

      {csdPendiente && !serverError && (
        <p className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3.5 py-2.5 text-sm font-medium text-amber-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Elegiste los archivos del certificado (CSD) pero aún no los subes. Haz clic en &quot;Subir certificado&quot;
          antes de guardar.
        </p>
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
          disabled={isPending || csdPendiente}
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
