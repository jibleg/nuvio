"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Ban,
  CheckCircle2,
  FileCode2,
  FileDown,
  FileText,
  Mail,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Wallet,
} from "lucide-react";
import { ROUTES } from "@/config/routes";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { DateField, FECHA_MINIMA_OPERACION, todayISO } from "@/components/ui/DateField";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatTile } from "@/components/ui/StatTile";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";
import type { FacturaListItem } from "../types";
import { EnviarCorreoModal } from "./EnviarCorreoModal";
import { RecurrirFacturaModal } from "./RecurrirFacturaModal";

const formatoMoneda = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

/**
 * `fechaTimbrado` llega como `YYYY-MM-DDTHH:mm:ss` (hora local ya sellada
 * por el PAC, sin offset) — se formatea a mano en vez de `new Date(...)`
 * para no depender de cómo el navegador interprete un datetime sin
 * timezone.
 */
function formatoFechaTimbrado(fechaTimbrado: string): string {
  const [fecha, hora] = fechaTimbrado.split("T");
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}, ${hora?.slice(0, 5) ?? ""}`;
}

const TONE_POR_ESTADO: Record<FacturaListItem["estado"], StatusTone> = {
  borrador: "neutral",
  timbrada: "brand",
  cancelada: "danger",
};

const ETIQUETA_POR_ESTADO: Record<FacturaListItem["estado"], string> = {
  borrador: "Borrador",
  timbrada: "Timbrada",
  cancelada: "Cancelada",
};

const ICONO_POR_ESTADO: Record<FacturaListItem["estado"], typeof FileText> = {
  borrador: Pencil,
  timbrada: CheckCircle2,
  cancelada: Ban,
};

type Filtro = "todas" | FacturaListItem["estado"];

const FILTROS: { value: Filtro; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "borrador", label: "Borradores" },
  { value: "timbrada", label: "Timbradas" },
  { value: "cancelada", label: "Canceladas" },
];

export function FacturasListado({
  facturas,
  puedeGestionar,
}: {
  facturas: FacturaListItem[];
  puedeGestionar: boolean;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const resumen = useMemo(() => {
    const timbradas = facturas.filter((f) => f.estado === "timbrada");
    const facturado = timbradas.reduce((acc, f) => acc + (f.total ? Number(f.total) : 0), 0);
    return {
      timbradas: timbradas.length,
      borradores: facturas.filter((f) => f.estado === "borrador").length,
      canceladas: facturas.filter((f) => f.estado === "cancelada").length,
      facturado,
    };
  }, [facturas]);

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return facturas.filter((f) => {
      if (filtro !== "todas" && f.estado !== filtro) return false;
      if (desde && (!f.fechaTimbrado || f.fechaTimbrado < desde)) return false;
      if (hasta && (!f.fechaTimbrado || f.fechaTimbrado > `${hasta}T23:59:59`)) return false;
      if (!q) return true;
      return (
        f.receptorNombre?.toLowerCase().includes(q) ||
        f.emisorNombre?.toLowerCase().includes(q) ||
        f.folioFiscal?.toLowerCase().includes(q)
      );
    });
  }, [facturas, busqueda, filtro, desde, hasta]);

  const columns: DataTableColumn<FacturaListItem>[] = [
    {
      key: "factura",
      header: "Factura",
      render: (f) => (
        <Link href={`${ROUTES.facturacion}/${f.id}`} className="group flex items-center gap-3">
          <span
            aria-hidden
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-aurora-500 text-white"
          >
            <FileText className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            {f.folioFiscal ? (
              <p className="truncate font-mono text-xs font-medium text-ink group-hover:text-brand-700 dark:group-hover:text-brand-300">
                {f.folioFiscal}
              </p>
            ) : (
              <p className="font-semibold text-ink group-hover:text-brand-700 dark:group-hover:text-brand-300">
                Borrador #{f.id}
              </p>
            )}
            {(f.serie || f.folio) && (
              <p className="text-xs text-muted">
                Serie {f.serie ?? "—"} · Folio {f.folio ?? "—"}
                {f.fechaTimbrado && <> · {formatoFechaTimbrado(f.fechaTimbrado)}</>}
              </p>
            )}
          </div>
        </Link>
      ),
    },
    { key: "emisor", header: "Emisor", render: (f) => <span className="text-ink-soft">{f.emisorNombre ?? "—"}</span> },
    { key: "receptor", header: "Receptor", render: (f) => <span className="text-ink-soft">{f.receptorNombre ?? "—"}</span> },
    {
      key: "total",
      header: "Total",
      align: "right",
      render: (f) => (
        <span className="font-medium text-ink">{f.total ? formatoMoneda.format(Number(f.total)) : "—"}</span>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      render: (f) => {
        const Icono = ICONO_POR_ESTADO[f.estado];
        return (
          <StatusBadge tone={TONE_POR_ESTADO[f.estado]} icon={<Icono className="h-3 w-3" />}>
            {ETIQUETA_POR_ESTADO[f.estado]}
          </StatusBadge>
        );
      },
    },
    {
      key: "acciones",
      header: "",
      align: "right",
      render: (f) => <FacturaAccionesMenu factura={f} puedeGestionar={puedeGestionar} />,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={Wallet} label="Facturado" value={formatoMoneda.format(resumen.facturado)} accent="from-brand-400 to-aurora-500" />
        <StatTile icon={CheckCircle2} label="Timbradas" value={resumen.timbradas} accent="from-emerald-400 to-brand-500" />
        <StatTile icon={Pencil} label="Borradores" value={resumen.borradores} accent="from-sky-soft to-brand-400" />
        <StatTile icon={Ban} label="Canceladas" value={resumen.canceladas} accent="from-slate-400 to-slate-500" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por cliente o folio fiscal"
            className="w-full rounded-full border border-line bg-surface py-2.5 pl-10 pr-4 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-brand-400"
          />
        </div>
        {puedeGestionar && (
          <Link
            href={`${ROUTES.facturacion}/nueva`}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-brand-800 dark:bg-brand-600 dark:text-brand-950 dark:hover:bg-brand-500"
          >
            <Plus className="h-4 w-4" />
            Nueva factura
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTROS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFiltro(f.value)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                filtro === f.value
                  ? "bg-brand-700 text-white dark:bg-brand-600 dark:text-brand-950"
                  : "border border-line text-ink-soft hover:border-brand-300 hover:text-brand-700 dark:hover:text-brand-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted">
          <DateField
            size="sm"
            value={desde}
            onChange={setDesde}
            min={FECHA_MINIMA_OPERACION}
            max={todayISO()}
            aria-label="Desde"
          />
          <span>—</span>
          <DateField
            size="sm"
            value={hasta}
            onChange={setHasta}
            min={FECHA_MINIMA_OPERACION}
            max={todayISO()}
            aria-label="Hasta"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtradas}
        getRowKey={(f) => f.id}
        emptyState={
          <EmptyState
            icon={FileText}
            title={facturas.length === 0 ? "Aún no hay facturas" : "Sin resultados"}
            description={
              facturas.length === 0
                ? "Cuando emitas tu primera factura, aparecerá aquí."
                : "Ajusta la búsqueda o los filtros para ver más resultados."
            }
          />
        }
      />
    </div>
  );
}

const MENU_WIDTH_PX = 208; // w-52
const MENU_HEIGHT_ESTIMATE_PX = 200;

/**
 * Descargar XML, enviar por correo y recurrir requieren la factura ya
 * timbrada (el propio endpoint de XML y los use cases lo exigen); descargar
 * PDF sí funciona sobre un borrador. Enviar y recurrir además requieren
 * permiso de gestión, igual que antes.
 *
 * El panel se renderiza en un portal a `document.body` (mismo patrón que
 * `SearchableSelect`): dentro de la fila quedaba recortado por el
 * `overflow-hidden`/`overflow-x-auto` de `DataTable`, sin importar el
 * z-index — y ese recorte es intencional ahí para las esquinas redondeadas
 * de la tabla, así que no se toca ese componente compartido.
 */
function FacturaAccionesMenu({ factura, puedeGestionar }: { factura: FacturaListItem; puedeGestionar: boolean }) {
  const [open, setOpen] = useState(false);
  const [posicion, setPosicion] = useState<{ left: number; top?: number; bottom?: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [correoAbierto, setCorreoAbierto] = useState(false);
  const [recurrirAbierto, setRecurrirAbierto] = useState(false);
  const disparadorRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (disparadorRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    // Cierra en scroll (fuera del propio panel) en vez de reposicionar: el
    // panel es `position: fixed` con coordenadas calculadas al abrir, así
    // que si la fila se desplaza (scroll de la tabla o de la página) queda
    // desalineado si no se cierra.
    const onScroll = (e: Event) => {
      if (panelRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  const toggleOpen = () => {
    if (!open && disparadorRef.current) {
      const rect = disparadorRef.current.getBoundingClientRect();
      const espacioAbajo = window.innerHeight - rect.bottom;
      const abrirHaciaArriba = espacioAbajo < MENU_HEIGHT_ESTIMATE_PX;
      setPosicion({
        left: Math.max(8, rect.right - MENU_WIDTH_PX),
        top: abrirHaciaArriba ? undefined : rect.bottom + 4,
        bottom: abrirHaciaArriba ? window.innerHeight - rect.top + 4 : undefined,
      });
    }
    setOpen((v) => !v);
  };

  const puedeXmlCorreo = factura.estado !== "borrador";
  const puedeRecurrir = puedeGestionar && factura.estado === "timbrada";
  const puedeCorreo = puedeGestionar && puedeXmlCorreo;

  return (
    <div className="relative inline-block text-left">
      <button
        ref={disparadorRef}
        type="button"
        onClick={toggleOpen}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Acciones"
        className="grid h-8 w-8 place-items-center rounded-full border border-line text-ink-soft transition-colors hover:border-brand-300 hover:text-brand-700 disabled:opacity-60 dark:hover:text-brand-300"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open &&
        mounted &&
        posicion &&
        createPortal(
          <div
            ref={panelRef}
            role="menu"
            style={{ position: "fixed", left: posicion.left, top: posicion.top, bottom: posicion.bottom }}
            className="z-[110] w-52 overflow-hidden rounded-xl border border-line bg-surface shadow-glow"
          >
            {puedeCorreo && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  setCorreoAbierto(true);
                }}
                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium text-ink transition-colors hover:bg-cloud"
              >
                <Mail className="h-4 w-4 text-muted" />
                Enviar por correo
              </button>
            )}
            <div className={puedeCorreo ? "border-t border-line" : undefined}>
              <a
                href={`${ROUTES.facturacion}/${factura.id}/pdf`}
                download
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium text-ink transition-colors hover:bg-cloud"
              >
                <FileDown className="h-4 w-4 text-muted" />
                Descargar PDF
              </a>
              {puedeXmlCorreo && (
                <a
                  href={`${ROUTES.facturacion}/${factura.id}/xml`}
                  download
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium text-ink transition-colors hover:bg-cloud"
                >
                  <FileCode2 className="h-4 w-4 text-muted" />
                  Descargar XML
                </a>
              )}
            </div>
            {puedeRecurrir && (
              <div className="border-t border-line">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    setRecurrirAbierto(true);
                  }}
                  title="Crea una nueva factura independiente con los mismos datos, para el siguiente periodo"
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium text-brand-700 transition-colors hover:bg-brand-500/10 dark:text-brand-300"
                >
                  <RefreshCw className="h-4 w-4" />
                  Recurrir factura
                </button>
              </div>
            )}
          </div>,
          document.body,
        )}

      <EnviarCorreoModal open={correoAbierto} idFactura={factura.id} onClose={() => setCorreoAbierto(false)} />
      <RecurrirFacturaModal open={recurrirAbierto} idFactura={factura.id} onClose={() => setRecurrirAbierto(false)} />
    </div>
  );
}
