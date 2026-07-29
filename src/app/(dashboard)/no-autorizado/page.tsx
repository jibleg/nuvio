import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { ROUTES } from "@/config/routes";

export const metadata = {
  title: "Sin acceso",
};

export default function NoAutorizadoPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:text-brand-300">
        <ShieldAlert className="h-8 w-8" />
      </span>
      <h1 className="mt-6 font-display text-2xl font-extrabold tracking-tight text-ink">
        No tienes acceso a esta sección
      </h1>
      <p className="mt-2 text-sm text-muted">
        Tu cuenta no cuenta con el permiso necesario. Si crees que es un error,
        contacta al administrador de tu empresa.
      </p>
      <Link
        href={ROUTES.dashboard}
        className="group mt-8 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-semibold text-ink shadow-soft transition-colors hover:border-brand-300"
      >
        <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
        Volver al panel
      </Link>
    </div>
  );
}
