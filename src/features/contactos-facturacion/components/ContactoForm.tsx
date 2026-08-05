"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, Building2, FileText, Loader2, Save } from "lucide-react";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { createContactoAction, listCatalogosContactoAction, updateContactoAction } from "../actions";
import type { ContactoDetalle, TipoContacto } from "../types";

const inputClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-all placeholder:text-muted focus:border-brand-400 focus:ring-4 focus:ring-brand-400/20";
const labelClass = "mb-1.5 block text-sm font-semibold text-ink-soft";

/**
 * Schema local para feedback inmediato en el form (strings tal como los
 * produce el DOM). El schema autoritativo con las transformaciones vive en
 * `../schemas.ts` y corre en el servidor.
 */
const clientSchema = z.object({
  tipo: z.enum(["cliente", "proveedor"]),
  razonSocial: z.string().trim().min(1, "Requerido"),
  rfc: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, "Requerido")
    .max(13, "Máximo 13 caracteres")
    .regex(/^[A-Z0-9]+$/, "Solo letras y números"),
  nombreComercial: z.string().trim(),
  calle: z.string().trim(),
  colonia: z.string().trim(),
  ciudad: z.string().trim(),
  codigoPostal: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d{5}$/.test(v), "5 dígitos"),
  telefono: z.string().trim(),
  email: z.union([z.literal(""), z.string().trim().toLowerCase().pipe(z.email("Correo inválido"))]),
  idRegimen: z.string(),
  idUso: z.string(),
  idFormaPago: z.string(),
  idMetodo: z.string(),
});
type FormValues = z.infer<typeof clientSchema>;

const TABS = [
  { id: "basica", label: "Información básica", icon: Building2 },
  { id: "facturacion", label: "Información de facturación", icon: FileText },
] as const;
type TabId = (typeof TABS)[number]["id"];

type Catalogos = {
  regimenes: { id: number; clave: string; descripcion: string | null }[];
  usos: { id: number; clave: string; descripcion: string | null }[];
  formasPago: { id: number; clave: string; descripcion: string | null }[];
  metodosPago: { id: number; clave: string; descripcion: string | null }[];
};

export function ContactoForm({
  mode,
  initial,
  tipoInicial,
  tipoBloqueado = false,
  onSuccess,
  onCancel,
}: {
  mode: "create" | "edit";
  initial?: ContactoDetalle;
  tipoInicial?: TipoContacto;
  /** Oculta el selector Cliente/Proveedor y fija `tipoInicial` — para contextos donde el otro tipo no aplica (p. ej. "Nuevo cliente" desde Facturación). */
  tipoBloqueado?: boolean;
  /** Recibe el id del contacto creado/editado, útil para autoseleccionarlo (ver `@/features/facturacion`). */
  onSuccess: (id?: number) => void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      tipo: initial?.tipo ?? tipoInicial ?? "cliente",
      razonSocial: initial?.razonSocial ?? "",
      rfc: initial?.rfc ?? "",
      nombreComercial: initial?.nombreComercial ?? "",
      calle: initial?.calle ?? "",
      colonia: initial?.colonia ?? "",
      ciudad: initial?.ciudad ?? "",
      codigoPostal: initial?.codigoPostal ? String(initial.codigoPostal) : "",
      telefono: initial?.telefono ?? "",
      email: initial?.email ?? "",
      idRegimen: initial?.idRegimen ? String(initial.idRegimen) : "",
      idUso: initial?.idUso ? String(initial.idUso) : "",
      idFormaPago: initial?.idFormaPago ? String(initial.idFormaPago) : "",
      idMetodo: initial?.idMetodo ? String(initial.idMetodo) : "",
    },
  });
  const tipo = watch("tipo");
  const idRegimenValue = watch("idRegimen");
  const idUsoValue = watch("idUso");
  const idFormaPagoValue = watch("idFormaPago");
  const idMetodoValue = watch("idMetodo");

  const [activeTab, setActiveTab] = useState<TabId>("basica");
  const [activo, setActivo] = useState(initial?.activo ?? true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [catalogos, setCatalogos] = useState<Catalogos>({ regimenes: [], usos: [], formasPago: [], metodosPago: [] });

  useEffect(() => {
    listCatalogosContactoAction().then(setCatalogos);
  }, []);

  const basicaTieneError = Boolean(
    errors.razonSocial || errors.rfc || errors.nombreComercial || errors.calle || errors.codigoPostal || errors.email,
  );
  const facturacionTieneError = Boolean(
    errors.idRegimen || errors.idUso || errors.idFormaPago || errors.idMetodo,
  );

  const onInvalid = (formErrors: FieldErrors<FormValues>) => {
    if (formErrors.razonSocial || formErrors.rfc || formErrors.codigoPostal || formErrors.email) {
      setActiveTab("basica");
    }
  };

  const onValid = (values: FormValues) => {
    setServerError(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createContactoAction(values)
          : await updateContactoAction(initial!.id, { ...values, activo });
      if (result && "error" in result) {
        setServerError(result.error);
        return;
      }
      onSuccess(mode === "create" ? (result as { id: number }).id : initial!.id);
    });
  };

  return (
    <form onSubmit={handleSubmit(onValid, onInvalid)} className="space-y-5" noValidate>
      <div className="flex gap-1 overflow-x-auto rounded-full border border-line bg-cloud/50 p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          const hasError = (tab.id === "basica" && basicaTieneError) || (tab.id === "facturacion" && facturacionTieneError);
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

      <div className="min-h-110 rounded-2xl border border-line bg-surface p-5 shadow-soft">
        {activeTab === "basica" && (
          <>
            {!tipoBloqueado && (
              <>
                <span className={labelClass}>Tipo</span>
                <div className="mb-4 inline-flex rounded-full border border-line bg-cloud/60 p-1">
                  {(["cliente", "proveedor"] as const).map((opcion) => (
                    <button
                      key={opcion}
                      type="button"
                      onClick={() => setValue("tipo", opcion, { shouldValidate: true })}
                      className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                        tipo === opcion
                          ? "bg-brand-700 text-white dark:bg-brand-600 dark:text-brand-950"
                          : "text-ink-soft hover:text-brand-600"
                      }`}
                    >
                      {opcion === "cliente" ? "Cliente" : "Proveedor"}
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre comercial">
                <input className={inputClass} placeholder="Opcional" {...register("nombreComercial")} />
              </Field>
              <Field label="Razón social" error={errors.razonSocial?.message}>
                <input className={inputClass} {...register("razonSocial")} />
              </Field>
              <Field label="RFC" error={errors.rfc?.message}>
                <input
                  className={inputClass}
                  maxLength={13}
                  style={{ textTransform: "uppercase" }}
                  {...register("rfc")}
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
              <Field label="Calle y número">
                <input className={inputClass} {...register("calle")} />
              </Field>
              <Field label="Colonia">
                <input className={inputClass} {...register("colonia")} />
              </Field>
              <Field label="Ciudad">
                <input className={inputClass} {...register("ciudad")} />
              </Field>
              <Field label="Teléfono">
                <input className={inputClass} {...register("telefono")} />
              </Field>
              <Field label="Correo" error={errors.email?.message}>
                <input className={inputClass} type="email" {...register("email")} />
              </Field>
            </div>

            {mode === "edit" && (
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
                  {activo ? "Activo" : "Inactivo"}
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === "facturacion" && (
          <>
            <p className="mb-4 text-xs text-muted">
              Se usan por defecto al elegir este {tipo === "proveedor" ? "proveedor" : "cliente"} en una factura nueva
              — ahí siguen siendo editables, esto solo evita recapturarlos cada vez.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Régimen fiscal" error={errors.idRegimen?.message}>
                <SearchableSelect
                  value={idRegimenValue}
                  onChange={(v) => setValue("idRegimen", v, { shouldValidate: true })}
                  placeholder="Sin capturar"
                  searchPlaceholder="Buscar régimen fiscal…"
                  options={catalogos.regimenes.map((r) => ({ value: String(r.id), label: r.clave, sublabel: r.descripcion ?? undefined }))}
                />
              </Field>
              <Field label="Uso de CFDI" error={errors.idUso?.message}>
                <SearchableSelect
                  value={idUsoValue}
                  onChange={(v) => setValue("idUso", v, { shouldValidate: true })}
                  placeholder="Sin capturar"
                  searchPlaceholder="Buscar uso de CFDI…"
                  options={catalogos.usos.map((u) => ({ value: String(u.id), label: u.clave, sublabel: u.descripcion ?? undefined }))}
                />
              </Field>
              <Field label="Forma de pago" error={errors.idFormaPago?.message}>
                <SearchableSelect
                  value={idFormaPagoValue}
                  onChange={(v) => setValue("idFormaPago", v, { shouldValidate: true })}
                  placeholder="Sin capturar"
                  searchPlaceholder="Buscar forma de pago…"
                  options={catalogos.formasPago.map((f) => ({ value: String(f.id), label: f.clave, sublabel: f.descripcion ?? undefined }))}
                />
              </Field>
              <Field label="Método de pago" error={errors.idMetodo?.message}>
                <SearchableSelect
                  value={idMetodoValue}
                  onChange={(v) => setValue("idMetodo", v, { shouldValidate: true })}
                  placeholder="Sin capturar"
                  searchPlaceholder="Buscar método de pago…"
                  options={catalogos.metodosPago.map((m) => ({ value: String(m.id), label: m.clave, sublabel: m.descripcion ?? undefined }))}
                />
              </Field>
            </div>
          </>
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
          {mode === "create" ? (tipo === "proveedor" ? "Crear proveedor" : "Crear cliente") : "Guardar cambios"}
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
