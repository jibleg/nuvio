"use client";

import { useState, useTransition } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertCircle,
  Building2,
  Check,
  Eye,
  EyeOff,
  LayoutGrid,
  Loader2,
  Save,
  ShieldCheck,
  User,
} from "lucide-react";
import { createUsuarioAction, updateUsuarioAction } from "../actions";
import type { UsuarioDetalle, UsuarioFormOptions } from "../types";

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "El correo es obligatorio")
  .pipe(z.email("Correo inválido"));

const createSchema = z.object({
  login: z.string().trim().min(3, "Mínimo 3 caracteres"),
  nombre: z.string().trim().min(1, "Requerido"),
  email: emailField,
  password: z
    .string()
    .min(1, "La contraseña es obligatoria")
    .min(6, "Mínimo 6 caracteres"),
});
const editSchema = z.object({
  login: z.string(),
  nombre: z.string().trim().min(1, "Requerido"),
  email: emailField,
  password: z.union([z.literal(""), z.string().min(6, "Mínimo 6 caracteres")]),
});

type FormValues = {
  login: string;
  nombre: string;
  email: string;
  password: string;
};

const TABS = [
  { id: "cuenta", label: "Datos de la cuenta", icon: User },
  { id: "perfiles", label: "Perfiles", icon: ShieldCheck },
  { id: "empresas", label: "Sucursales", icon: Building2 },
  { id: "modulos", label: "Módulos", icon: LayoutGrid },
] as const;

type TabId = (typeof TABS)[number]["id"];

const inputClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-all placeholder:text-muted focus:border-brand-400 focus:ring-4 focus:ring-brand-400/20";
const labelClass = "mb-1.5 block text-sm font-semibold text-ink-soft";

export function UsuarioForm({
  mode,
  options,
  initial,
  onSuccess,
  onCancel,
}: {
  mode: "create" | "edit";
  options: UsuarioFormOptions;
  initial?: UsuarioDetalle;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(mode === "create" ? createSchema : editSchema),
    defaultValues: {
      login: initial?.login ?? "",
      nombre: initial?.nombre ?? "",
      email: initial?.email ?? "",
      password: "",
    },
  });

  const [activeTab, setActiveTab] = useState<TabId>("cuenta");
  const [showPassword, setShowPassword] = useState(false);
  const [perfilIds, setPerfilIds] = useState<number[]>(initial?.perfilIds ?? []);
  const [empresaIds, setEmpresaIds] = useState<number[]>(
    initial?.empresaIds ?? [],
  );
  const [moduloKeys, setModuloKeys] = useState<string[]>(
    initial?.moduloKeys ?? [],
  );
  const [activo, setActivo] = useState(initial?.activo ?? true);
  const [perfilError, setPerfilError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const toggle = (
    id: number,
    list: number[],
    setList: (value: number[]) => void,
  ) => {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  const toggleModulo = (key: string) => {
    setModuloKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const cuentaTieneError = Boolean(
    errors.login || errors.nombre || errors.email || errors.password,
  );

  const onInvalid = (formErrors: FieldErrors<FormValues>) => {
    if (formErrors.login || formErrors.nombre || formErrors.email || formErrors.password) {
      setActiveTab("cuenta");
    }
  };

  const onValid = (values: FormValues) => {
    setServerError(null);
    if (perfilIds.length === 0) {
      setPerfilError("Selecciona al menos un perfil");
      setActiveTab("perfiles");
      return;
    }
    setPerfilError(null);

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createUsuarioAction({
              login: values.login,
              nombre: values.nombre,
              email: values.email,
              password: values.password,
              perfiles: perfilIds,
              empresas: empresaIds,
              modulos: moduloKeys,
            })
          : await updateUsuarioAction(initial!.id, {
              nombre: values.nombre,
              email: values.email,
              password: values.password,
              activo,
              perfiles: perfilIds,
              empresas: empresaIds,
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
      <div className="flex gap-1 overflow-x-auto rounded-full border border-line bg-cloud/50 p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          const hasError =
            (tab.id === "cuenta" && cuentaTieneError) ||
            (tab.id === "perfiles" && Boolean(perfilError));
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                active
                  ? "bg-surface text-brand-700 shadow-soft dark:text-brand-200"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {hasError && (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
              )}
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5 shadow-soft">
        {activeTab === "cuenta" && (
          <div className="grid gap-4 sm:grid-cols-2">
            {mode === "create" ? (
              <Field label="Usuario (login)" error={errors.login?.message}>
                <input
                  className={inputClass}
                  placeholder="nombre.usuario"
                  autoComplete="username"
                  {...register("login")}
                />
              </Field>
            ) : (
              <Field label="Usuario (login)">
                <input className={`${inputClass} opacity-60`} value={initial?.login} disabled readOnly />
              </Field>
            )}
            <Field label="Nombre" error={errors.nombre?.message}>
              <input className={inputClass} placeholder="Nombre completo" {...register("nombre")} />
            </Field>
            <Field label="Correo" error={errors.email?.message}>
              <input
                className={inputClass}
                type="email"
                placeholder="correo@empresa.com"
                autoComplete="email"
                {...register("email")}
              />
              <p className="mt-1 text-xs text-muted">Se usa para iniciar sesión; debe ser único.</p>
            </Field>
            <Field
              label={mode === "create" ? "Contraseña" : "Nueva contraseña (opcional)"}
              error={errors.password?.message}
            >
              <div className="relative">
                <input
                  className={`${inputClass} pr-11`}
                  type={showPassword ? "text" : "password"}
                  placeholder={mode === "create" ? "Mínimo 6 caracteres" : "Dejar en blanco para no cambiar"}
                  autoComplete="new-password"
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

            {mode === "edit" && (
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
                  {activo ? "Usuario activo" : "Usuario inactivo"}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "perfiles" && (
          <div>
            <ChipGroup
              items={options.perfiles.map((p) => ({ id: p.id, label: p.nombre }))}
              selected={perfilIds}
              onToggle={(id) => toggle(id, perfilIds, setPerfilIds)}
            />
            {perfilError && <p className="mt-2 text-sm text-red-500">{perfilError}</p>}
          </div>
        )}

        {activeTab === "empresas" && (
          <ChipGroup
            items={options.empresas.map((e) => ({
              id: e.id,
              label: (e.nombreCorto ?? e.nombreComercial) + (e.idEmpresaMatriz === null ? " (Matriz)" : ""),
            }))}
            selected={empresaIds}
            onToggle={(id) => toggle(id, empresaIds, setEmpresaIds)}
          />
        )}

        {activeTab === "modulos" && (
          <div className="flex flex-wrap gap-2">
            {options.modulos.map((modulo) => {
              const active = moduloKeys.includes(modulo.key);
              return (
                <button
                  key={modulo.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleModulo(modulo.key)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "border-brand-400 bg-brand-50 text-brand-700 dark:text-brand-200"
                      : "border-line text-ink-soft hover:border-brand-300"
                  }`}
                >
                  {active && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  {modulo.nombre}
                  {!modulo.disponible && (
                    <span className="text-xs text-muted">· pronto</span>
                  )}
                </button>
              );
            })}
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
          {mode === "create" ? "Crear usuario" : "Guardar cambios"}
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

function ChipGroup({
  items,
  selected,
  onToggle,
}: {
  items: { id: number; label: string }[];
  selected: number[];
  onToggle: (id: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const active = selected.includes(item.id);
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(item.id)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "border-brand-400 bg-brand-50 text-brand-700 dark:text-brand-200"
                : "border-line text-ink-soft hover:border-brand-300"
            }`}
          >
            {active && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
