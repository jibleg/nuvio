"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";

export type SearchableSelectOption = {
  value: string;
  label: string;
  sublabel?: string;
};

/**
 * Select con buscador para listas largas (más de ~5 opciones): un `<select>`
 * nativo obliga a desplazarse por todo el catálogo, y varios de los que usa
 * Facturación (uso de CFDI, régimen fiscal, forma de pago, clientes) crecen
 * más allá de eso. Filtra en memoria — la lista completa ya vive en el
 * cliente, a diferencia de `ClaveSearchInput` (que busca en servidor sobre
 * catálogos de decenas de miles de filas).
 *
 * El panel se renderiza en un portal a `document.body` (como `Modal`), no
 * como hijo posicionado en el propio flujo: dentro de un modal, cualquier
 * campo que no esté hasta arriba quedaba recortado por el `overflow-hidden`
 * de la tarjeta del modal, sin importar el z-index.
 */
export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Selecciona…",
  searchPlaceholder = "Buscar…",
}: {
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [query, setQuery] = useState("");
  const [posicion, setPosicion] = useState<{ top: number; left: number; width: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const disparadorRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  const seleccionado = options.find((o) => o.value === value) ?? null;
  const filtradas =
    query.trim().length === 0
      ? options
      : options.filter((o) => {
          const q = query.trim().toLowerCase();
          return o.label.toLowerCase().includes(q) || o.sublabel?.toLowerCase().includes(q);
        });

  function abrir() {
    const rect = disparadorRef.current?.getBoundingClientRect();
    if (rect) setPosicion({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    setAbierto(true);
  }

  useEffect(() => {
    if (abierto) {
      setQuery("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [abierto]);

  useEffect(() => {
    function onClickFuera(e: MouseEvent) {
      const target = e.target as Node;
      if (disparadorRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setAbierto(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(false);
    }
    // Cierra en vez de reposicionar: más simple y evita que el panel quede
    // desalineado si el contenedor (p. ej. el cuerpo scrollable del Modal) se
    // mueve. Ignora el scroll DENTRO del propio panel (la lista de opciones)
    // — si no, hacer scroll para ver más opciones lo cerraba de inmediato.
    function onScroll(e: Event) {
      if (panelRef.current?.contains(e.target as Node)) return;
      setAbierto(false);
    }
    document.addEventListener("mousedown", onClickFuera);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onClickFuera);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, []);

  return (
    <div ref={disparadorRef} className="relative">
      <button
        type="button"
        onClick={() => (abierto ? setAbierto(false) : abrir())}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-left text-sm text-ink outline-none transition-all focus:border-brand-400 focus:ring-4 focus:ring-brand-400/20"
      >
        {seleccionado ? (
          <span className="truncate">
            {seleccionado.label}
            {seleccionado.sublabel && <span className="text-muted"> — {seleccionado.sublabel}</span>}
          </span>
        ) : (
          <span className="truncate text-muted">{placeholder}</span>
        )}
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted transition-transform ${abierto ? "rotate-180" : ""}`} />
      </button>

      {abierto &&
        mounted &&
        posicion &&
        createPortal(
          <div
            ref={panelRef}
            style={{ position: "fixed", top: posicion.top, left: posicion.left, width: posicion.width }}
            className="z-[110] overflow-hidden rounded-xl border border-line bg-surface shadow-glow"
          >
            <div className="relative border-b border-line p-2">
              <Search className="pointer-events-none absolute left-5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-lg border border-line bg-surface py-2 pl-8 pr-3 text-sm text-ink outline-none placeholder:text-muted focus:border-brand-400"
              />
            </div>
            <div className="max-h-60 overflow-y-auto py-1">
              {filtradas.length === 0 ? (
                <p className="px-3.5 py-2.5 text-sm text-muted">Sin resultados.</p>
              ) : (
                filtradas.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => {
                      onChange(o.value);
                      setAbierto(false);
                    }}
                    className="flex w-full items-center justify-between gap-2 px-3.5 py-2 text-left text-sm hover:bg-cloud/60"
                  >
                    <span className="truncate">
                      <span className="text-ink">{o.label}</span>
                      {o.sublabel && <span className="text-muted"> — {o.sublabel}</span>}
                    </span>
                    {o.value === value && <Check className="h-4 w-4 shrink-0 text-brand-600" />}
                  </button>
                ))
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
