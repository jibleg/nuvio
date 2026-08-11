import { Compass } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/config/routes";

export const metadata = {
  title: "Página no encontrada",
};

/**
 * 404 global (`src/app/not-found.tsx`): el único fallback fuera de
 * `(dashboard)` y `superadmin/(panel)` (que tienen el suyo propio para
 * conservar su chrome), así que también es lo que ve un visitante público
 * del landing con una URL rota — usa el mismo lenguaje visual que Hero.
 */
export default function NotFound() {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 py-24 text-center">
      <div className="absolute inset-0 -z-20 bg-mesh opacity-70" />
      <div className="absolute inset-0 -z-10">
        <div className="animate-aurora absolute -left-24 top-10 h-72 w-72 rounded-full bg-brand-300/40 blur-3xl" />
        <div className="animate-aurora absolute right-0 top-1/3 h-80 w-80 rounded-full bg-aurora-300/40 blur-3xl [animation-delay:3s]" />
      </div>
      <div className="dotted-grid pointer-events-none absolute inset-0 -z-10 opacity-40" />

      <Logo href="/" size="lg" className="mb-10" />

      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:text-brand-300">
        <Compass className="h-8 w-8" />
      </span>

      <p className="mt-6 font-display text-sm font-bold uppercase tracking-widest text-brand-600 dark:text-brand-300">
        Error 404
      </p>
      <h1 className="mt-2 text-balance font-display text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">
        Esta página no existe
      </h1>
      <p className="mt-3 max-w-md text-pretty text-base leading-relaxed text-muted">
        Revisa la dirección o vuelve al inicio — desde ahí puedes llegar a cualquier parte de Nuvio.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button href={ROUTES.home} variant="primary" withArrow>
          Volver al inicio
        </Button>
        <Button href={ROUTES.login} variant="secondary">
          Iniciar sesión
        </Button>
      </div>
    </div>
  );
}
