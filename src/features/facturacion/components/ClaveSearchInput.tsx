"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, Search } from "lucide-react";
import type { CatalogoItem } from "@/lib/cfdi/catalogos";

const inputClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-all placeholder:text-muted focus:border-brand-400 focus:ring-4 focus:ring-brand-400/20";

/**
 * Typeahead genérico sobre un catálogo SAT (clave prod/serv o clave unidad).
 * El panel de resultados va en un portal a `document.body` (como `Modal` y
 * `SearchableSelect`): dentro de un modal, el `overflow-hidden` de la
 * tarjeta recorta cualquier panel posicionado en el flujo normal.
 */
export function ClaveSearchInput({
  placeholder,
  valorMostrado,
  buscar,
  onSeleccionar,
}: {
  placeholder: string;
  /** Texto a mostrar mientras no se está editando (p. ej. "01010101 — No existe en el catálogo"). */
  valorMostrado: string;
  buscar: (query: string) => Promise<CatalogoItem[]>;
  onSeleccionar: (item: CatalogoItem) => void;
}) {
  const [query, setQuery] = useState("");
  const [editando, setEditando] = useState(false);
  const [opciones, setOpciones] = useState<CatalogoItem[]>([]);
  const [cargando, setCargando] = useState(false);
  const [posicion, setPosicion] = useState<{ top: number; left: number; width: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!editando || query.trim().length < 2) {
      setOpciones([]);
      return;
    }
    let vivo = true;
    setCargando(true);
    const timer = setTimeout(() => {
      buscar(query).then((r) => {
        if (vivo) {
          setOpciones(r);
          setCargando(false);
        }
      });
    }, 300);
    return () => {
      vivo = false;
      clearTimeout(timer);
    };
  }, [query, editando, buscar]);

  useEffect(() => {
    function onClickFuera(e: MouseEvent) {
      const target = e.target as Node;
      if (contenedorRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setEditando(false);
    }
    // Ignora el scroll DENTRO del propio panel de resultados — si no, hacer
    // scroll para ver más opciones lo cerraba de inmediato.
    function onScroll(e: Event) {
      if (panelRef.current?.contains(e.target as Node)) return;
      setEditando(false);
    }
    document.addEventListener("mousedown", onClickFuera);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onClickFuera);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, []);

  const mostrarPanel = editando && (query.trim().length >= 2 || cargando);

  return (
    <div ref={contenedorRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
        <input
          className={`${inputClass} pl-9`}
          placeholder={placeholder}
          value={editando ? query : valorMostrado}
          onFocus={() => {
            const rect = contenedorRef.current?.getBoundingClientRect();
            if (rect) setPosicion({ top: rect.bottom + 4, left: rect.left, width: Math.max(rect.width, 280) });
            setEditando(true);
            setQuery("");
          }}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {mostrarPanel &&
        mounted &&
        posicion &&
        createPortal(
          <div
            ref={panelRef}
            style={{ position: "fixed", top: posicion.top, left: posicion.left, width: posicion.width }}
            className="z-[110] max-h-56 overflow-auto rounded-xl border border-line bg-surface py-1 shadow-glow"
          >
            {cargando ? (
              <div className="flex items-center gap-2 px-3.5 py-2 text-sm text-muted">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Buscando…
              </div>
            ) : opciones.length === 0 ? (
              <p className="px-3.5 py-2 text-sm text-muted">Sin resultados.</p>
            ) : (
              opciones.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    onSeleccionar(o);
                    setEditando(false);
                  }}
                  className="block w-full px-3.5 py-2 text-left text-sm hover:bg-cloud/60"
                >
                  <span className="font-medium text-ink">{o.clave}</span>{" "}
                  <span className="text-muted">{o.descripcion ?? ""}</span>
                </button>
              ))
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
