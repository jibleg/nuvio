"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
/** Semana iniciando en lunes, convención es-MX habitual. */
const DIAS_SEMANA = ["L", "M", "M", "J", "V", "S", "D"];

function parseISO(value: string | undefined): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplay(value: string | undefined): string | null {
  const date = parseISO(value);
  if (!date) return null;
  return `${date.getDate()} ${MESES_CORTOS[date.getMonth()]} ${date.getFullYear()}`;
}

function esMismoDia(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Fecha de hoy en local, formato ISO `yyyy-mm-dd` — para usar como `max` en campos que no aceptan fechas futuras. */
export function todayISO(): string {
  return toISO(new Date());
}

/**
 * Arranque de operación real de Nuvio (decisión del usuario, 2026-08-12):
 * ningún dato de negocio (facturas, pagos, filtros de consulta) es anterior
 * a esta fecha. Úsala como `min` en cualquier `DateField` nuevo que capture
 * o filtre por fechas de operación, junto con `max={todayISO()}`.
 */
export const FECHA_MINIMA_OPERACION = "2026-01-01";

/** Grilla fija de 6 semanas (42 días) empezando el lunes de la semana del día 1. */
function buildMonthGrid(viewYear: number, viewMonth: number): Date[] {
  const first = new Date(viewYear, viewMonth, 1);
  const firstWeekday = (first.getDay() + 6) % 7; // domingo=0..sábado=6 -> lunes=0..domingo=6
  const start = new Date(viewYear, viewMonth, 1 - firstWeekday);
  return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

const SIZE_CLASSES = {
  sm: "rounded-full py-1.5 pl-8 pr-3 text-xs",
  md: "rounded-xl py-2.5 pl-10 pr-3.5 text-sm",
} as const;

const ICON_CLASSES = {
  sm: "left-2.5 h-3.5 w-3.5",
  md: "left-3.5 h-4 w-4",
} as const;

const PANEL_HEIGHT_PX = 360;
const PANEL_WIDTH_PX = 288;

type DateFieldProps = {
  /** ISO `yyyy-mm-dd`. Si se omite, el campo queda no controlado (usa `defaultValue`). */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Si se da, se agrega un `<input type="hidden">` con este name — para `<form method="get">` como el del paquete contable. */
  name?: string;
  id?: string;
  required?: boolean;
  /** ISO `yyyy-mm-dd`, inclusive. Los días fuera de [`min`, `max`] quedan deshabilitados en el calendario. */
  min?: string;
  max?: string;
  size?: "sm" | "md";
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

/**
 * Selector de fecha propio — el calendario nativo del navegador no se puede
 * re-diseñar (ni cerrado ni, sobre todo, abierto), así que en vez de estilizar
 * alrededor de un `<input type="date">` esto dibuja el calendario entero con
 * nuestros propios tokens, como cualquier otro dropdown de la app (portal a
 * `document.body`, mismo patrón de abrir arriba/abajo según espacio que
 * `SearchableSelect`/los menús de acciones — ver [[nuvio-ui-patterns]]).
 */
export function DateField({
  value,
  defaultValue,
  onChange,
  name,
  id,
  required,
  min,
  max,
  size = "md",
  placeholder = "Seleccionar fecha",
  disabled,
  className,
  "aria-label": ariaLabel,
}: DateFieldProps) {
  const limiteMin = parseISO(min);
  const limiteMax = parseISO(max);
  const fueraDeRango = (d: Date) => (limiteMin !== null && d < limiteMin) || (limiteMax !== null && d > limiteMax);
  const controlado = value !== undefined;
  const [interno, setInterno] = useState(defaultValue ?? "");
  const actual = controlado ? value : interno;

  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const [view, setView] = useState(() => {
    const d = parseISO(actual) ?? new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current && !panelRef.current.contains(target)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const abrir = () => {
    if (disabled) return;
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const espacioAbajo = window.innerHeight - rect.bottom;
      const arriba = espacioAbajo < PANEL_HEIGHT_PX && rect.top > espacioAbajo;
      setOpenUp(arriba);
      setCoords({
        top: arriba ? rect.top - PANEL_HEIGHT_PX - 8 : rect.bottom + 8,
        left: Math.min(rect.left, window.innerWidth - PANEL_WIDTH_PX - 12),
      });
    }
    const d = parseISO(actual) ?? new Date();
    setView({ year: d.getFullYear(), month: d.getMonth() });
    setOpen(true);
  };

  const elegir = (date: Date) => {
    const iso = toISO(date);
    if (!controlado) setInterno(iso);
    onChange?.(iso);
    setOpen(false);
  };

  const limpiar = () => {
    if (!controlado) setInterno("");
    onChange?.("");
    setOpen(false);
  };

  const hoy = new Date();
  const seleccionado = parseISO(actual);
  const dias = buildMonthGrid(view.year, view.month);
  const mesAnterior = () => setView((v) => (v.month === 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 }));
  const mesSiguiente = () => setView((v) => (v.month === 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: v.month + 1 }));
  // Deshabilita la navegación cuando el mes completo adyacente ya queda fuera de [min, max].
  const finDeMesAnterior = new Date(view.year, view.month, 0);
  const inicioDeMesSiguiente = new Date(view.year, view.month + 1, 1);
  const noHayMesAnterior = limiteMin !== null && finDeMesAnterior < limiteMin;
  const noHayMesSiguiente = limiteMax !== null && inicioDeMesSiguiente > limiteMax;
  const hoyFueraDeRango = fueraDeRango(hoy);

  return (
    <div className="relative inline-block">
      {name && <input type="hidden" name={name} value={actual} required={required} />}
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : abrir())}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={cn(
          "relative flex w-full items-center border border-line bg-surface text-left text-ink outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60",
          "focus:border-brand-400 focus:ring-4 focus:ring-brand-400/20",
          open && "border-brand-400 ring-4 ring-brand-400/20",
          SIZE_CLASSES[size],
          className,
        )}
      >
        <Calendar aria-hidden className={cn("pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted", ICON_CLASSES[size])} />
        <span className={cn("truncate", !formatDisplay(actual) && "text-muted")}>{formatDisplay(actual) ?? placeholder}</span>
      </button>

      {open &&
        coords &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            style={{ position: "fixed", top: coords.top, left: coords.left, width: PANEL_WIDTH_PX }}
            className={cn(
              "z-50 rounded-2xl border border-line bg-surface p-4 shadow-glow",
              openUp ? "origin-bottom" : "origin-top",
            )}
          >
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={mesAnterior}
                disabled={noHayMesAnterior}
                aria-label="Mes anterior"
                className="grid h-7 w-7 place-items-center rounded-full text-ink-soft transition-colors hover:bg-cloud hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent dark:hover:text-brand-300"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <p className="text-sm font-semibold text-ink">
                {MESES[view.month]} {view.year}
              </p>
              <button
                type="button"
                onClick={mesSiguiente}
                disabled={noHayMesSiguiente}
                aria-label="Mes siguiente"
                className="grid h-7 w-7 place-items-center rounded-full text-ink-soft transition-colors hover:bg-cloud hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent dark:hover:text-brand-300"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {DIAS_SEMANA.map((d, i) => (
                <span key={i} className="grid h-7 place-items-center text-[11px] font-semibold uppercase text-muted">
                  {d}
                </span>
              ))}
              {dias.map((d, i) => {
                const fueraDeMes = d.getMonth() !== view.month;
                const esHoy = esMismoDia(d, hoy);
                const esSeleccionado = seleccionado !== null && esMismoDia(d, seleccionado);
                const deshabilitado = fueraDeRango(d);
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={deshabilitado}
                    onClick={() => elegir(d)}
                    className={cn(
                      "grid h-8 w-8 place-items-center rounded-full text-sm transition-colors",
                      deshabilitado
                        ? "cursor-not-allowed text-muted/30"
                        : esSeleccionado
                          ? "bg-brand-700 font-semibold text-white shadow-glow dark:bg-brand-600 dark:text-brand-950"
                          : esHoy
                            ? "font-semibold text-brand-700 ring-1 ring-inset ring-brand-400 dark:text-brand-300"
                            : fueraDeMes
                              ? "text-muted/40 hover:bg-cloud"
                              : "text-ink hover:bg-cloud",
                    )}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
              <button
                type="button"
                onClick={() => elegir(hoy)}
                disabled={hoyFueraDeRango}
                className="text-xs font-semibold text-brand-600 transition-colors hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:text-brand-300"
              >
                Hoy
              </button>
              {!required && actual && (
                <button
                  type="button"
                  onClick={limpiar}
                  className="text-xs font-medium text-muted transition-colors hover:text-ink"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
