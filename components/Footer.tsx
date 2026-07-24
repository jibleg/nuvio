import { Logo } from "./ui/Logo";

const columns = [
  {
    title: "Productos",
    links: ["Punto de Venta", "Inventario", "Facturación Electrónica", "Compras", "Contabilidad"],
  },
  {
    title: "Próximamente",
    links: ["CRM", "Nómina", "Control de asistencias"],
    soon: true,
  },
  {
    title: "Nuvio",
    links: ["Nuestra filosofía", "Manifiesto", "Contacto", "Blog"],
  },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-line bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-pretty text-sm leading-relaxed text-muted">
              Tu negocio merece más tiempo para crecer. Nosotros nos encargamos del
              resto.
            </p>
            <p className="mt-4 text-sm font-semibold text-brand-500">
              Devolvemos tiempo para crecer.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-bold text-ink">{col.title}</h4>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="group inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-brand-600"
                    >
                      {link}
                      {col.soon && (
                        <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand-400">
                          Pronto
                        </span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-line pt-8 sm:flex-row">
          <p className="text-sm text-muted">
            © {2026} Nuvio. Hecho con enfoque humano en Latinoamérica.
          </p>
          <div className="flex items-center gap-6 text-sm text-muted">
            <a href="#" className="transition-colors hover:text-brand-600">
              Privacidad
            </a>
            <a href="#" className="transition-colors hover:text-brand-600">
              Términos
            </a>
            <a href="#" className="transition-colors hover:text-brand-600">
              Soporte
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
