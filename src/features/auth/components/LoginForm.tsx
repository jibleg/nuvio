"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { easeOutSoft } from "@/lib/motion";
import { loginSchema, type LoginInput } from "../schemas";
import { loginAction } from "../actions";

const inputClass =
  "w-full rounded-xl border border-line bg-surface py-3 pl-11 pr-3 text-sm text-ink outline-none transition-all duration-300 placeholder:text-muted focus:border-brand-400 focus:ring-4 focus:ring-brand-400/20";
const labelClass = "mb-1.5 block text-sm font-semibold text-ink-soft";
const iconClass =
  "pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted transition-colors peer-focus:text-brand-500";

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (values: LoginInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await loginAction(values);
      if (result?.error) setServerError(result.error);
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeOutSoft, delay: 0.05 }}
      >
        <label htmlFor="email" className={labelClass}>
          Correo
        </label>
        <div className="relative">
          <input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            placeholder="tu@correo.com"
            className={`peer ${inputClass}`}
            {...register("email")}
          />
          <Mail className={iconClass} />
        </div>
        {errors.email && (
          <p className="mt-1.5 text-sm text-red-500">{errors.email.message}</p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeOutSoft, delay: 0.12 }}
      >
        <label htmlFor="password" className={labelClass}>
          Contraseña
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            className={`peer ${inputClass} pr-11`}
            {...register("password")}
          />
          <Lock className={iconClass} />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute right-2.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted transition-colors hover:text-brand-500"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1.5 text-sm text-red-500">{errors.password.message}</p>
        )}
      </motion.div>

      {serverError && (
        <motion.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-sm font-medium text-red-500"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {serverError}
        </motion.p>
      )}

      <motion.button
        type="submit"
        disabled={isPending}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-brand-700 px-6 py-3.5 text-[0.95rem] font-semibold text-white shadow-glow transition-colors duration-300 hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-brand-600 dark:text-brand-950 dark:hover:bg-brand-500"
      >
        <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
          <span className="ring-shimmer absolute inset-0 opacity-60" />
        </span>
        <span className="relative z-10 inline-flex items-center gap-2">
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Entrando…
            </>
          ) : (
            <>
              Entrar
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </>
          )}
        </span>
      </motion.button>
    </form>
  );
}
