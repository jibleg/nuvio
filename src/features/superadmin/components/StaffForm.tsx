"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Save, ShieldAlert } from "lucide-react";
import { createStaffAction, resetStaffPasswordAction, updateStaffAction } from "../actions";
import type { StaffDetalle } from "../types";

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "El correo es obligatorio")
  .pipe(z.email("Correo inválido"));

const createSchema = z.object({
  nombre: z.string().trim().min(1, "Requerido"),
  email: emailField,
  password: z.string().min(1, "La contraseña es obligatoria").min(6, "Mínimo 6 caracteres"),
});
type CreateValues = z.infer<typeof createSchema>;

const editSchema = z.object({
  nombre: z.string().trim().min(1, "Requerido"),
  email: emailField,
});
type EditValues = z.infer<typeof editSchema>;

const inputClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-all placeholder:text-muted focus:border-brand-400 focus:ring-4 focus:ring-brand-400/20";
const labelClass = "mb-1.5 block text-sm font-semibold text-ink-soft";

export function StaffForm({
  mode,
  initial,
  esUnoMismo,
  onSuccess,
  onCancel,
}: {
  mode: "create" | "edit";
  initial?: StaffDetalle;
  /** true si la fila que se edita es la cuenta con la que se inició sesión — no se puede desactivar. */
  esUnoMismo?: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  if (mode === "edit" && initial) {
    return (
      <EditStaffForm initial={initial} esUnoMismo={Boolean(esUnoMismo)} onSuccess={onSuccess} onCancel={onCancel} />
    );
  }
  return <CreateStaffForm onSuccess={onSuccess} onCancel={onCancel} />;
}

function CreateStaffForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { nombre: "", email: "", password: "" },
  });
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onValid = (values: CreateValues) => {
    setServerError(null);
    startTransition(async () => {
      const result = await createStaffAction(values);
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
          <Field label="Nombre" error={errors.nombre?.message}>
            <input className={inputClass} placeholder="Nombre completo" {...register("nombre")} />
          </Field>
          <Field label="Correo" error={errors.email?.message}>
            <input className={inputClass} type="email" placeholder="correo@nuvio.app" {...register("email")} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Contraseña" error={errors.password?.message}>
              <div className="relative">
                <input
                  className={`${inputClass} pr-11`}
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  {...register("password")}
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
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-sunrise-400/30 bg-sunrise-300/20 px-3.5 py-3 text-xs text-ink dark:bg-sunrise-400/10">
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sunrise-500" />
        Esta cuenta tendrá acceso completo al panel interno de Nuvio: todos los clientes, todas las
        empresas, sin aislamiento por tenant.
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
          Crear cuenta
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

function EditStaffForm({
  initial,
  esUnoMismo,
  onSuccess,
  onCancel,
}: {
  initial: StaffDetalle;
  esUnoMismo: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { nombre: initial.nombre, email: initial.email },
  });
  const [activo, setActivo] = useState(initial.activo);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onValid = (values: EditValues) => {
    setServerError(null);
    startTransition(async () => {
      const result = await updateStaffAction(initial.id, { ...values, activo });
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
          <Field label="Nombre" error={errors.nombre?.message}>
            <input className={inputClass} {...register("nombre")} />
          </Field>
          <Field label="Correo" error={errors.email?.message}>
            <input className={inputClass} type="email" {...register("email")} />
          </Field>

          <div className="sm:col-span-2">
            <span className={labelClass}>Estado</span>
            <button
              type="button"
              role="switch"
              aria-checked={activo}
              disabled={esUnoMismo}
              onClick={() => setActivo((v) => !v)}
              className="flex items-center gap-3 text-sm font-medium text-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${activo ? "bg-brand-500" : "bg-line"}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${activo ? "translate-x-6" : "translate-x-1"}`}
                />
              </span>
              {activo ? "Cuenta activa" : "Cuenta inactiva"}
            </button>
            {esUnoMismo && (
              <p className="mt-1.5 text-xs text-muted">No puedes desactivar la cuenta con la que iniciaste sesión.</p>
            )}
          </div>
        </div>
      </div>

      <ResetStaffPasswordSection staffId={initial.id} nombre={initial.nombre} />

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

/** Mutación independiente de "Guardar cambios": su propio botón y estado, igual que `ResetAdminPasswordSection` de Clientes. */
function ResetStaffPasswordSection({ staffId, nombre }: { staffId: number; nombre: string }) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const onReset = () => {
    setSuccess(false);
    if (password.length < 6) {
      setError("Mínimo 6 caracteres");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await resetStaffPasswordAction(staffId, { password });
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
      <span className={labelClass}>Contraseña</span>
      <p className="mb-3 text-xs text-muted">{nombre}</p>
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

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <span className={labelClass}>{label}</span>
      {children}
      {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
    </div>
  );
}
