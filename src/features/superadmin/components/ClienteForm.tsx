"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LayoutGrid,
  Lock,
  Save,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import { APP_MODULOS } from "@/config/modules";
import { getPlan, PLANES, type Plan, type PlanKey } from "@/config/plans";
import { ModuleIcon } from "@/features/modulos/components/module-icons";
import {
  checkSlugDisponibleAction,
  onboardClienteAction,
  resetAdminPasswordAction,
  updateClienteAction,
} from "../actions";
import type { ClienteDetalle } from "../types";

const SLUG_TAKEN_MESSAGE = "Este slug ya está en uso por otro cliente.";

const NEGOCIO_MODULOS = APP_MODULOS.filter((m) => m.key !== "administracion");
const ADMINISTRACION_MODULO = APP_MODULOS.find((m) => m.key === "administracion")!;

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "El correo es obligatorio")
  .pipe(z.email("Correo inválido"));

const slugField = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Mínimo 2 caracteres")
  .max(63, "Máximo 63 caracteres")
  .regex(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    "Solo minúsculas, números y guiones",
  );

const rfcField = z
  .string()
  .trim()
  .toUpperCase()
  .max(13, "Máximo 13 caracteres")
  .regex(/^[A-Z0-9]*$/, "Solo letras y números");

const PLAN_KEYS = PLANES.map((plan) => plan.key) as [PlanKey, ...PlanKey[]];
const planField = z.enum(PLAN_KEYS, "Selecciona un plan");

const createSchema = z.object({
  clienteNombre: z.string().trim().min(1, "Requerido"),
  slug: slugField,
  plan: planField,
  empresaNombreComercial: z.string().trim().min(1, "Requerido"),
  empresaNombreCorto: z.string().trim(),
  empresaRazonSocial: z.string().trim(),
  empresaRfc: rfcField,
  adminNombre: z.string().trim().min(1, "Requerido"),
  adminEmail: emailField,
  adminPassword: z
    .string()
    .min(1, "La contraseña es obligatoria")
    .min(6, "Mínimo 6 caracteres"),
});
type CreateValues = z.infer<typeof createSchema>;

const editSchema = z.object({
  nombre: z.string().trim().min(1, "Requerido"),
});
type EditValues = z.infer<typeof editSchema>;

const TABS = [
  { id: "cliente", label: "Cliente", icon: Building2 },
  { id: "empresa", label: "Empresa", icon: Building2 },
  { id: "admin", label: "Administrador", icon: UserCog },
  { id: "modulos", label: "Módulos", icon: LayoutGrid },
] as const;
type TabId = (typeof TABS)[number]["id"];

const STEP_FIELDS: Record<TabId, readonly (keyof CreateValues)[]> = {
  cliente: ["clienteNombre", "slug", "plan"],
  empresa: ["empresaNombreComercial", "empresaRfc"],
  admin: ["adminNombre", "adminEmail", "adminPassword"],
  modulos: [],
};

const inputClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-all placeholder:text-muted focus:border-brand-400 focus:ring-4 focus:ring-brand-400/20";
const labelClass = "mb-1.5 block text-sm font-semibold text-ink-soft";

/** Fuerza mayúsculas en el valor real del input (no solo visualmente), preservando el cursor. */
function uppercaseInput(e: React.ChangeEvent<HTMLInputElement>) {
  const input = e.target;
  const cursor = input.selectionStart;
  input.value = input.value.toUpperCase();
  if (cursor !== null) input.setSelectionRange(cursor, cursor);
}

export function ClienteForm({
  mode,
  initial,
  onSuccess,
  onCancel,
}: {
  mode: "create" | "edit";
  initial?: ClienteDetalle;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  if (mode === "edit" && initial) {
    return <EditClienteForm initial={initial} onSuccess={onSuccess} onCancel={onCancel} />;
  }
  return <CreateClienteForm onSuccess={onSuccess} onCancel={onCancel} />;
}

function CreateClienteForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    trigger,
    setError,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      clienteNombre: "",
      slug: "",
      plan: "emprendedor",
      empresaNombreComercial: "",
      empresaNombreCorto: "",
      empresaRazonSocial: "",
      empresaRfc: "",
      adminNombre: "",
      adminEmail: "",
      adminPassword: "",
    },
  });

  const [activeTab, setActiveTab] = useState<TabId>("cliente");
  const [showPassword, setShowPassword] = useState(false);
  const [moduloKeys, setModuloKeys] = useState<string[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState(false);
  const [isPending, startTransition] = useTransition();

  const slug = watch("slug");
  const planKey = watch("plan");
  const plan = getPlan(planKey) ?? PLANES[0];
  const stepIndex = TABS.findIndex((tab) => tab.id === activeTab);
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === TABS.length - 1;

  // Chequeo en vivo de disponibilidad del slug: feedback inmediato al escribir,
  // sin esperar a llegar al último paso para descubrir que ya está tomado.
  useEffect(() => {
    const candidate = slug.trim().toLowerCase();
    setSlugAvailable(false);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(candidate) || candidate.length < 2) {
      setCheckingSlug(false);
      return;
    }
    setCheckingSlug(true);
    const timer = setTimeout(async () => {
      const available = await checkSlugDisponibleAction(candidate);
      setCheckingSlug(false);
      if (!available) {
        setError("slug", { type: "manual", message: SLUG_TAKEN_MESSAGE });
      } else {
        setSlugAvailable(true);
        clearErrors("slug");
      }
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const toggleModulo = (key: string) => {
    setModuloKeys((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (plan.maxModulosNegocio !== null && prev.length >= plan.maxModulosNegocio) return prev;
      return [...prev, key];
    });
  };

  const selectPlan = (key: PlanKey) => {
    setValue("plan", key);
    const nuevoPlan = getPlan(key);
    if (nuevoPlan && nuevoPlan.maxModulosNegocio !== null) {
      setModuloKeys((prev) => prev.slice(0, nuevoPlan.maxModulosNegocio!));
    }
  };

  const tabHasError: Record<TabId, boolean> = {
    cliente: Boolean(errors.clienteNombre || errors.slug || errors.plan),
    empresa: Boolean(errors.empresaNombreComercial || errors.empresaRfc),
    admin: Boolean(errors.adminNombre || errors.adminEmail || errors.adminPassword),
    modulos: false,
  };

  const onInvalid = (formErrors: FieldErrors<CreateValues>) => {
    if (formErrors.clienteNombre || formErrors.slug || formErrors.plan) setActiveTab("cliente");
    else if (formErrors.empresaNombreComercial || formErrors.empresaRfc) setActiveTab("empresa");
    else if (formErrors.adminNombre || formErrors.adminEmail || formErrors.adminPassword)
      setActiveTab("admin");
  };

  const goToStep = (index: number) => setActiveTab(TABS[index].id);

  const goNext = async () => {
    const fields = STEP_FIELDS[activeTab];
    let valid = fields.length === 0 || (await trigger(fields));

    // Re-chequeo autoritativo: no confiar solo en el resultado del debounce
    // en vivo, por si el usuario avanzó antes de que resolviera.
    if (valid && activeTab === "cliente" && !slugAvailable) {
      const available = await checkSlugDisponibleAction(watch("slug").trim().toLowerCase());
      if (!available) {
        setError("slug", { type: "manual", message: SLUG_TAKEN_MESSAGE });
        valid = false;
      } else {
        setSlugAvailable(true);
      }
    }

    if (valid) goToStep(Math.min(stepIndex + 1, TABS.length - 1));
  };

  const goBack = () => goToStep(Math.max(stepIndex - 1, 0));

  const onValid = (values: CreateValues) => {
    setServerError(null);
    startTransition(async () => {
      const result = await onboardClienteAction({
        clienteNombre: values.clienteNombre,
        slug: values.slug,
        plan: values.plan,
        empresaNombreComercial: values.empresaNombreComercial,
        empresaNombreCorto: values.empresaNombreCorto,
        empresaRazonSocial: values.empresaRazonSocial,
        empresaRfc: values.empresaRfc,
        adminNombre: values.adminNombre,
        adminEmail: values.adminEmail,
        adminPassword: values.adminPassword,
        modulos: moduloKeys,
      });
      if (result?.error) {
        setServerError(result.error);
        return;
      }
      onSuccess();
    });
  };

  return (
    <form onSubmit={handleSubmit(onValid, onInvalid)} className="space-y-5" noValidate>
      <div className="flex items-center">
        {TABS.map((tab, index) => {
          const isCompleted = index < stepIndex;
          const isCurrent = index === stepIndex;
          return (
            <div key={tab.id} className={`flex items-center ${index < TABS.length - 1 ? "flex-1" : ""}`}>
              <button
                type="button"
                onClick={() => goToStep(index)}
                className="group relative flex shrink-0 flex-col items-center gap-1.5"
              >
                <span
                  className={`grid h-9 w-9 place-items-center rounded-full text-sm font-bold transition-colors ${
                    isCurrent
                      ? "bg-brand-700 text-white shadow-glow dark:bg-brand-600 dark:text-brand-950"
                      : isCompleted
                        ? "bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                        : "bg-cloud text-muted group-hover:text-ink-soft"
                  }`}
                >
                  {isCompleted ? <Check className="h-4 w-4" strokeWidth={3} /> : index + 1}
                </span>
                <span
                  className={`whitespace-nowrap text-xs font-semibold ${
                    isCurrent ? "text-ink" : "text-muted"
                  }`}
                >
                  {tab.label}
                </span>
                {tabHasError[tab.id] && (
                  <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-surface" />
                )}
              </button>
              {index < TABS.length - 1 && (
                <div
                  className={`mx-2 mb-5 h-0.5 flex-1 rounded-full transition-colors ${
                    isCompleted ? "bg-brand-500" : "bg-line"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5 shadow-soft">
        {activeTab === "cliente" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre del cliente" error={errors.clienteNombre?.message}>
              <input
                className={inputClass}
                placeholder="Ej. ACME Corporativo"
                {...register("clienteNombre")}
              />
            </Field>
            <Field label="Slug (subdominio)" error={errors.slug?.message}>
              <input
                className={inputClass}
                placeholder="acme"
                autoCapitalize="off"
                autoCorrect="off"
                {...register("slug")}
              />
              <p className="mt-1 truncate text-xs text-muted">
                Accederán desde{" "}
                <code className="rounded bg-cloud px-1 py-0.5 text-brand-700 dark:text-brand-300">
                  {slug || "slug"}.nuvio.app
                </code>
              </p>
              {checkingSlug && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Verificando disponibilidad…
                </p>
              )}
              {!checkingSlug && slugAvailable && !errors.slug && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-300">
                  <CheckCircle2 className="h-3 w-3" />
                  Disponible
                </p>
              )}
            </Field>
            <div className="sm:col-span-2">
              <PlanSelector selected={planKey} onSelect={selectPlan} error={errors.plan?.message} />
            </div>
          </div>
        )}

        {activeTab === "empresa" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Nombre comercial"
              error={errors.empresaNombreComercial?.message}
            >
              <input
                className={inputClass}
                placeholder="Ej. ACME Matriz"
                {...register("empresaNombreComercial")}
              />
            </Field>
            <Field label="Nombre corto">
              <input className={inputClass} placeholder="ACME" {...register("empresaNombreCorto")} />
            </Field>
            <Field label="Razón social">
              <input
                className={inputClass}
                placeholder="ACME SA DE CV"
                {...register("empresaRazonSocial")}
              />
            </Field>
            <Field label="RFC" error={errors.empresaRfc?.message}>
              <input
                className={`${inputClass} uppercase`}
                placeholder="ACM010101AAA"
                maxLength={13}
                autoCapitalize="off"
                autoCorrect="off"
                {...register("empresaRfc", { onChange: uppercaseInput })}
              />
            </Field>
          </div>
        )}

        {activeTab === "admin" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre" error={errors.adminNombre?.message}>
              <input
                className={inputClass}
                placeholder="Nombre completo"
                {...register("adminNombre")}
              />
            </Field>
            <Field label="Correo" error={errors.adminEmail?.message}>
              <input
                className={inputClass}
                type="email"
                placeholder="correo@empresa.com"
                {...register("adminEmail")}
              />
            </Field>
            <Field label="Contraseña" error={errors.adminPassword?.message}>
              <div className="relative">
                <input
                  className={`${inputClass} pr-11`}
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  {...register("adminPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-2.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted transition-colors hover:text-brand-500"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            <div className="flex items-start gap-2 self-end rounded-xl bg-brand-50 px-3 py-2.5 text-xs text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Este usuario nace con el perfil Administrador y todos los permisos.
            </div>
          </div>
        )}

        {activeTab === "modulos" && (
          <ModulosField selected={moduloKeys} onToggle={toggleModulo} plan={plan} />
        )}
      </div>

      {serverError && (
        <p className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-sm font-medium text-red-500">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {serverError}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {!isFirstStep && (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:border-brand-300 hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" />
              Regresar
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-4 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:text-brand-600"
          >
            Cancelar
          </button>
        </div>

        {isLastStep ? (
          <button
            key="submit"
            type="button"
            onClick={handleSubmit(onValid, onInvalid)}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-brand-800 disabled:opacity-70 dark:bg-brand-600 dark:text-brand-950 dark:hover:bg-brand-500"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Crear cliente
          </button>
        ) : (
          <button
            key="next"
            type="button"
            onClick={goNext}
            className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-brand-800 dark:bg-brand-600 dark:text-brand-950 dark:hover:bg-brand-500"
          >
            Continuar
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </form>
  );
}

function EditClienteForm({
  initial,
  onSuccess,
  onCancel,
}: {
  initial: ClienteDetalle;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { nombre: initial.nombre },
  });
  const [activo, setActivo] = useState(initial.activo);
  const [planKey, setPlanKey] = useState<PlanKey>(initial.plan);
  const [planError, setPlanError] = useState<string | null>(null);
  const [moduloKeys, setModuloKeys] = useState<string[]>(
    initial.moduloKeys.filter((k) => k !== "administracion"),
  );
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const plan = getPlan(planKey) ?? PLANES[0];

  const toggleModulo = (key: string) => {
    setModuloKeys((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (plan.maxModulosNegocio !== null && prev.length >= plan.maxModulosNegocio) return prev;
      return [...prev, key];
    });
  };

  const selectPlan = (key: PlanKey) => {
    const nuevoPlan = getPlan(key);
    if (!nuevoPlan) return;
    if (nuevoPlan.maxEmpresas !== null && initial.empresasCount > nuevoPlan.maxEmpresas) {
      setPlanError(
        `Este cliente ya tiene ${initial.empresasCount} empresa(s); el plan ${nuevoPlan.nombre} permite hasta ${nuevoPlan.maxEmpresas}.`,
      );
      return;
    }
    setPlanError(null);
    setPlanKey(key);
    if (nuevoPlan.maxModulosNegocio !== null) {
      setModuloKeys((prev) => prev.slice(0, nuevoPlan.maxModulosNegocio!));
    }
  };

  const onValid = (values: EditValues) => {
    setServerError(null);
    startTransition(async () => {
      const result = await updateClienteAction(initial.id, {
        nombre: values.nombre,
        activo,
        plan: planKey,
        modulos: moduloKeys,
      });
      if (result?.error) {
        setServerError(result.error);
        return;
      }
      onSuccess();
    });
  };

  return (
    <form onSubmit={handleSubmit(onValid)} className="space-y-5" noValidate>
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-soft">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Slug (subdominio)">
            <input className={`${inputClass} opacity-60`} value={initial.slug} disabled readOnly />
          </Field>
          <Field label="Nombre del cliente" error={errors.nombre?.message}>
            <input className={inputClass} {...register("nombre")} />
          </Field>

          <div className="sm:col-span-2">
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
              {activo ? "Cliente activo" : "Cliente inactivo"}
            </button>
          </div>

          <div className="sm:col-span-2">
            <PlanSelector selected={planKey} onSelect={selectPlan} error={planError ?? undefined} />
            <p className="mt-2 text-xs text-muted">
              Empresas: {initial.empresasCount}
              {plan.maxEmpresas !== null ? `/${plan.maxEmpresas}` : " (sin límite)"}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5 shadow-soft">
        <span className={labelClass}>Módulos licenciados</span>
        <ModulosField selected={moduloKeys} onToggle={toggleModulo} plan={plan} />
      </div>

      <ResetAdminPasswordSection clienteId={initial.id} adminUsuario={initial.adminUsuario} />

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
          Guardar cambios
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

/**
 * Restablece la contraseña del usuario administrador (login "admin") del
 * cliente. Es una mutación independiente de "Guardar cambios": su propio
 * botón, su propio estado de carga/éxito, para no mezclarla con el resto.
 */
function ResetAdminPasswordSection({
  clienteId,
  adminUsuario,
}: {
  clienteId: number;
  adminUsuario: ClienteDetalle["adminUsuario"];
}) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!adminUsuario) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-soft">
        <span className={labelClass}>Contraseña del administrador</span>
        <p className="mt-1.5 text-sm text-muted">
          Este cliente no tiene un usuario administrador (login "admin").
        </p>
      </div>
    );
  }

  const onReset = () => {
    setSuccess(false);
    if (password.length < 6) {
      setError("Mínimo 6 caracteres");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await resetAdminPasswordAction(clienteId, { password });
      if (result?.error) {
        setError(result.error);
        return;
      }
      setPassword("");
      setSuccess(true);
    });
  };

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-soft">
      <span className={labelClass}>Contraseña del administrador</span>
      <p className="mb-3 text-xs text-muted">
        {adminUsuario.nombre}
        {adminUsuario.email ? ` · ${adminUsuario.email}` : ""}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1">
          <div className="relative">
            <input
              className={`${inputClass} pr-11`}
              type={showPassword ? "text" : "password"}
              placeholder="Nueva contraseña (mínimo 6 caracteres)"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setSuccess(false);
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="absolute right-2.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted transition-colors hover:text-brand-500"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
          {success && (
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-brand-600 dark:text-brand-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Contraseña actualizada.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onReset}
          disabled={isPending}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-brand-300 hover:text-brand-700 disabled:opacity-60 dark:hover:text-brand-300"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          Restablecer
        </button>
      </div>
    </div>
  );
}

/**
 * Módulos licenciados por el cliente. "Administración" es base del paquete
 * (siempre incluido, no seleccionable); los módulos de negocio dependen de lo
 * que el cliente haya contratado, topados por el plan.
 */
function ModulosField({
  selected,
  onToggle,
  plan,
}: {
  selected: string[];
  onToggle: (key: string) => void;
  plan: Plan;
}) {
  const cap = plan.maxModulosNegocio;
  const capReached = cap !== null && selected.length >= cap;

  return (
    <div>
      <p className="text-xs text-muted">
        Plan <span className="font-semibold text-ink-soft">{plan.nombre}</span>:{" "}
        {cap === null
          ? "todos los módulos de negocio incluidos (incluye los que se lancen a futuro)."
          : `${selected.length}/${cap} módulo(s) de negocio incluidos.`}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <span
          title="Incluido siempre en el paquete base"
          className="inline-flex cursor-default items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-sm font-medium text-brand-700 dark:border-brand-500/25 dark:bg-brand-500/10 dark:text-brand-300"
        >
          <ModuleIcon name={ADMINISTRACION_MODULO.icon} className="h-3.5 w-3.5" />
          {ADMINISTRACION_MODULO.nombre}
          <Lock className="h-3 w-3 opacity-70" />
        </span>
        {NEGOCIO_MODULOS.map((modulo) => {
          const active = selected.includes(modulo.key);
          const disabled = !active && capReached;
          return (
            <button
              key={modulo.key}
              type="button"
              aria-pressed={active}
              disabled={disabled}
              title={disabled ? `El plan ${plan.nombre} no incluye más módulos de negocio.` : undefined}
              onClick={() => onToggle(modulo.key)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "border-brand-400 bg-brand-50 text-brand-700 dark:text-brand-200"
                  : disabled
                    ? "cursor-not-allowed border-line text-muted opacity-50"
                    : "border-line text-ink-soft hover:border-brand-300"
              }`}
            >
              {active ? (
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              ) : (
                <ModuleIcon name={modulo.icon} className="h-3.5 w-3.5" />
              )}
              {modulo.nombre}
              {!modulo.disponible && <span className="text-xs text-muted">· próximamente</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Selector de plan comercial: cards con nombre y límites, usado en el alta y la edición. */
function PlanSelector({
  selected,
  onSelect,
  error,
}: {
  selected: PlanKey;
  onSelect: (key: PlanKey) => void;
  error?: string;
}) {
  return (
    <div>
      <span className={labelClass}>Plan</span>
      <div className="grid gap-2 sm:grid-cols-3">
        {PLANES.map((plan) => {
          const active = plan.key === selected;
          return (
            <button
              key={plan.key}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(plan.key)}
              className={`rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                active
                  ? "border-brand-400 bg-brand-50 dark:bg-brand-500/10"
                  : "border-line hover:border-brand-300"
              }`}
            >
              <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                {active && <Check className="h-3.5 w-3.5 text-brand-600 dark:text-brand-300" strokeWidth={3} />}
                {plan.nombre}
              </span>
              <span className="mt-0.5 block text-xs text-muted">{plan.descripcion}</span>
            </button>
          );
        })}
      </div>
      {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
    </div>
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
