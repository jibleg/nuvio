"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Building2, Copy, FileText, Loader2, Package, Pencil, Plus, Save, Trash2, UserPlus, Zap } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { ROUTES } from "@/config/routes";
import type { ContactoDetalle, ContactoListItem } from "@/features/contactos-facturacion";
// Import directo (no vía el barrel `@/features/contactos-facturacion`): ese índice
// también re-exporta `queries.ts` (lee la BD con `postgres`, incompatible con
// Client Components). Los tipos de arriba sí son seguros porque se borran en compilación.
import { getContactoDetalleAction } from "@/features/contactos-facturacion/actions";
import { ContactoForm } from "@/features/contactos-facturacion/components/ContactoForm";
import {
  actualizarBorradorAction,
  crearBorradorAction,
  listCatalogosFacturaAction,
  listClientesFacturablesAction,
  listEmisoresAction,
  timbrarFacturaAction,
  type CatalogosFactura,
} from "../actions";
import type { EmisorListItem } from "../repositories/emisor-repository";
import type { ConceptoInput, FacturaDetalle } from "../types";
import { ConceptoModal } from "./ConceptoModal";

const inputClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-all placeholder:text-muted focus:border-brand-400 focus:ring-4 focus:ring-brand-400/20";
const labelClass = "mb-1.5 block text-sm font-semibold text-ink-soft";
const labelInlineClass = "text-sm font-semibold text-ink-soft";
const sectionHeader = "flex items-center gap-2";

const formatoMoneda = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

type ConceptoForm = ConceptoInput & { key: string };

export function FacturaForm(props: { mode: "create" } | { mode: "edit"; initial: FacturaDetalle }) {
  const router = useRouter();
  const initial = props.mode === "edit" ? props.initial : undefined;

  const [emisores, setEmisores] = useState<EmisorListItem[]>([]);
  const [clientes, setClientes] = useState<ContactoListItem[]>([]);
  const [catalogos, setCatalogos] = useState<CatalogosFactura | null>(null);
  const [nuevoClienteAbierto, setNuevoClienteAbierto] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<ContactoDetalle | null>(null);
  const [cargandoClienteEditar, setCargandoClienteEditar] = useState(false);

  useEffect(() => {
    listEmisoresAction().then((data) => {
      setEmisores(data);
      // Con un solo RFC emisor no hay nada que elegir — se preselecciona para
      // no obligar al operador a confirmar algo sin alternativa real.
      if (!initial && data.length === 1) setIdEmpresaEmisora(String(data[0].id));
    });
    listClientesFacturablesAction().then(setClientes);
    listCatalogosFacturaAction().then(setCatalogos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [idEmpresaEmisora, setIdEmpresaEmisora] = useState(initial ? String(initial.idEmpresaEmisora) : "");
  const [idContactoFacturacion, setIdContactoFacturacion] = useState(
    initial ? String(initial.idContactoFacturacion) : "",
  );
  const [idUso, setIdUso] = useState(initial ? String(initial.idUso) : "");
  const [idFormaPago, setIdFormaPago] = useState(initial ? String(initial.idFormaPago) : "");
  const [idMetodo, setIdMetodo] = useState(initial ? String(initial.idMetodo) : "");
  const [idMoneda, setIdMoneda] = useState(initial ? String(initial.idMoneda) : "");
  const [observacion, setObservacion] = useState(initial?.observacion ?? "");
  const [conceptos, setConceptos] = useState<ConceptoForm[]>(() =>
    initial ? initial.conceptos.map((c) => ({ ...c, key: crypto.randomUUID() })) : [],
  );

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<ConceptoForm | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (props.mode === "create" && catalogos && !idMoneda) {
      const mxn = catalogos.monedas.find((m) => m.clave === "MXN");
      if (mxn) setIdMoneda(String(mxn.id));
    }
  }, [catalogos, props.mode, idMoneda]);

  const totales = useMemo(() => {
    const subtotal = conceptos.reduce((acc, c) => acc + c.cantidad * c.valorUnitario, 0);
    const iva = conceptos
      .filter((c) => c.gravado)
      .reduce((acc, c) => acc + Math.round(c.cantidad * c.valorUnitario * 0.16 * 100) / 100, 0);
    return { subtotal, iva, total: subtotal + iva };
  }, [conceptos]);

  /** Prellena uso/forma/método con los valores por defecto del cliente (pestaña "Información de facturación" del contacto) — solo si los trae capturados; el resto queda como estaba. Siguen siendo editables después. */
  function aplicarDefaultsCliente(cliente: ContactoListItem | undefined) {
    if (!cliente) return;
    if (cliente.idUso) setIdUso(String(cliente.idUso));
    if (cliente.idFormaPago) setIdFormaPago(String(cliente.idFormaPago));
    if (cliente.idMetodo) setIdMetodo(String(cliente.idMetodo));
  }

  function seleccionarCliente(id: string) {
    setIdContactoFacturacion(id);
    aplicarDefaultsCliente(clientes.find((c) => String(c.id) === id));
  }

  /** Edita los datos propios del cliente seleccionado (RFC, régimen, domicilio) sin salir de la factura — útil al recurrir una factura si el cliente cambió algún dato desde el periodo anterior. */
  function editarClienteActual() {
    if (!idContactoFacturacion) return;
    setCargandoClienteEditar(true);
    getContactoDetalleAction(Number(idContactoFacturacion)).then((detalle) => {
      setCargandoClienteEditar(false);
      if (detalle) setClienteEditando(detalle);
    });
  }

  function abrirNuevoConcepto() {
    setEditando(null);
    setModalAbierto(true);
  }
  function abrirEdicionConcepto(c: ConceptoForm) {
    setEditando(c);
    setModalAbierto(true);
  }
  function guardarConcepto(valores: ConceptoInput) {
    if (editando) {
      setConceptos((prev) => prev.map((c) => (c.key === editando.key ? { ...valores, key: c.key } : c)));
    } else {
      setConceptos((prev) => [...prev, { ...valores, key: crypto.randomUUID() }]);
    }
    setModalAbierto(false);
  }
  function eliminarConcepto(key: string) {
    setConceptos((prev) => prev.filter((c) => c.key !== key));
  }

  /** Clona un concepto tal cual, al final de la lista — para capturar rápido varios conceptos casi iguales: se duplica y luego se ajusta con "Editar" solo lo que cambia. */
  function duplicarConcepto(c: ConceptoForm) {
    setConceptos((prev) => [...prev, { ...c, key: crypto.randomUUID() }]);
  }

  function validar(): string | null {
    if (!idEmpresaEmisora) return "Selecciona la empresa emisora.";
    if (!idContactoFacturacion) return "Selecciona el cliente.";
    if (!idUso) return "Selecciona el uso de CFDI.";
    if (!idFormaPago) return "Selecciona la forma de pago.";
    if (!idMetodo) return "Selecciona el método de pago.";
    if (!idMoneda) return "Selecciona la moneda.";
    if (conceptos.length === 0) return "Agrega al menos un concepto.";
    return null;
  }

  function payload() {
    return {
      idEmpresaEmisora,
      idContactoFacturacion,
      idUso,
      idFormaPago,
      idMetodo,
      idMoneda,
      observacion,
      conceptos: conceptos.map(({ key: _key, ...c }) => c),
    };
  }

  const guardar = (irATimbrar: boolean) => {
    const mensaje = validar();
    if (mensaje) {
      setError(mensaje);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result =
        props.mode === "create"
          ? await crearBorradorAction(payload())
          : await actualizarBorradorAction(props.initial.id, payload());
      if (result?.error) {
        setError(result.error);
        return;
      }
      const id = props.mode === "create" ? (result as { id?: number }).id : props.initial.id;
      if (!id) return;

      if (irATimbrar) {
        const timbrado = await timbrarFacturaAction(id);
        if (timbrado?.error) {
          setError(timbrado.error);
        }
      }
      router.push(`${ROUTES.facturacion}/${id}`);
      router.refresh();
    });
  };

  return (
    <div className="space-y-5">
      <Card
        title={
          <span className={sectionHeader}>
            <FileText className="h-4 w-4 shrink-0 text-brand-600" />
            Datos de la factura
          </span>
        }
        bodyClassName="p-5"
      >
        {emisores.length === 1 && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 px-5 py-4 shadow-glow">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25">
              <Building2 className="h-5 w-5 text-white" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-white/70">Empresa emisora</p>
              <p className="truncate font-display text-base font-bold text-white">{emisores[0].nombreComercial}</p>
              <p className="truncate font-mono text-xs text-white/75">{emisores[0].rfc}</p>
            </div>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {emisores.length > 1 && (
            <div>
              <span className={labelClass}>Empresa emisora</span>
              <SearchableSelect
                value={idEmpresaEmisora}
                onChange={setIdEmpresaEmisora}
                searchPlaceholder="Buscar empresa…"
                options={emisores.map((e) => ({ value: String(e.id), label: e.nombreComercial, sublabel: e.rfc }))}
              />
            </div>
          )}
          <div className={emisores.length === 1 ? "sm:col-span-2" : undefined}>
            <div className="mb-1.5 flex items-center justify-between">
              <span className={labelInlineClass}>Cliente</span>
              <div className="flex items-center gap-3">
                {idContactoFacturacion && (
                  <button
                    type="button"
                    onClick={editarClienteActual}
                    disabled={cargandoClienteEditar}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 transition-colors hover:text-brand-700 disabled:opacity-60 dark:hover:text-brand-300"
                  >
                    {cargandoClienteEditar ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Pencil className="h-3.5 w-3.5" />
                    )}
                    Editar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setNuevoClienteAbierto(true)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 transition-colors hover:text-brand-700 dark:hover:text-brand-300"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Nuevo cliente
                </button>
              </div>
            </div>
            <SearchableSelect
              value={idContactoFacturacion}
              onChange={seleccionarCliente}
              searchPlaceholder="Buscar cliente…"
              options={clientes.map((c) => ({
                value: String(c.id),
                label: c.nombreComercial ?? c.razonSocial,
                sublabel: c.rfc,
              }))}
            />
          </div>
          <div>
            <span className={labelClass}>Uso de CFDI</span>
            <SearchableSelect
              value={idUso}
              onChange={setIdUso}
              searchPlaceholder="Buscar uso de CFDI…"
              options={(catalogos?.usos ?? []).map((u) => ({
                value: String(u.id),
                label: u.clave,
                sublabel: u.descripcion ?? undefined,
              }))}
            />
          </div>
          <div>
            <span className={labelClass}>Moneda</span>
            <select className={inputClass} value={idMoneda} onChange={(e) => setIdMoneda(e.target.value)}>
              <option value="">Selecciona…</option>
              {catalogos?.monedas.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.clave}
                </option>
              ))}
            </select>
          </div>
          <div>
            <span className={labelClass}>Forma de pago</span>
            <SearchableSelect
              value={idFormaPago}
              onChange={setIdFormaPago}
              searchPlaceholder="Buscar forma de pago…"
              options={(catalogos?.formasPago ?? []).map((f) => ({
                value: String(f.id),
                label: f.clave,
                sublabel: f.descripcion ?? undefined,
              }))}
            />
          </div>
          <div>
            <span className={labelClass}>Método de pago</span>
            <select className={inputClass} value={idMetodo} onChange={(e) => setIdMetodo(e.target.value)}>
              <option value="">Selecciona…</option>
              {catalogos?.metodosPago.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.clave} — {m.descripcion ?? m.clave}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <span className={labelClass}>Observaciones (opcional)</span>
            <input className={inputClass} value={observacion} onChange={(e) => setObservacion(e.target.value)} />
          </div>
        </div>
      </Card>

      <Card
        title={
          <span className={sectionHeader}>
            <Package className="h-4 w-4 shrink-0 text-brand-600" />
            Conceptos
          </span>
        }
        action={
          <button
            type="button"
            onClick={abrirNuevoConcepto}
            className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-brand-800 dark:bg-brand-600 dark:text-brand-950 dark:hover:bg-brand-500"
          >
            <Plus className="h-4 w-4" />
            Agregar concepto
          </button>
        }
        bodyClassName="p-5"
      >
        <div>
          {conceptos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-cloud/30 p-8 text-center text-sm text-muted">
              Aún no agregas ningún concepto.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-line">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-cloud/40 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                    <th className="px-4 py-2.5">Concepto</th>
                    <th className="px-4 py-2.5 text-right">Cantidad</th>
                    <th className="px-4 py-2.5 text-right">Precio</th>
                    <th className="px-4 py-2.5 text-center">IVA</th>
                    <th className="px-4 py-2.5 text-right">Importe</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {conceptos.map((c) => (
                    <tr key={c.key} className="border-b border-line/60 last:border-0 hover:bg-cloud/30">
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">{c.descripcion}</p>
                        <p className="text-xs text-muted">
                          {c.claveProdServ} · {c.claveUnidad}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right text-ink-soft">{c.cantidad}</td>
                      <td className="px-4 py-3 text-right text-ink-soft">{formatoMoneda.format(c.valorUnitario)}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                            c.gravado ? "bg-brand-50 text-brand-700 dark:text-brand-200" : "bg-cloud text-muted"
                          }`}
                        >
                          {c.gravado ? "16%" : "Exento"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-ink">
                        {formatoMoneda.format(c.cantidad * c.valorUnitario)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => duplicarConcepto(c)}
                            aria-label="Duplicar concepto"
                            title="Duplicar: agrega una copia para capturar rápido conceptos casi iguales"
                            className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-cloud hover:text-brand-700 dark:hover:text-brand-300"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => abrirEdicionConcepto(c)}
                            aria-label="Editar concepto"
                            className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-cloud hover:text-brand-700 dark:hover:text-brand-300"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => eliminarConcepto(c.key)}
                            aria-label="Eliminar concepto"
                            className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-red-500/10 hover:text-red-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {conceptos.length > 0 && (
            <div className="mt-4 flex flex-col items-end gap-1 text-sm">
              <p className="text-ink-soft">Subtotal: {formatoMoneda.format(totales.subtotal)}</p>
              <p className="text-ink-soft">IVA: {formatoMoneda.format(totales.iva)}</p>
              <p className="text-base font-semibold text-ink">Total: {formatoMoneda.format(totales.total)}</p>
            </div>
          )}
        </div>
      </Card>

      {error && (
        <p className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-sm font-medium text-red-500">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={() => guardar(false)}
          className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-brand-300 hover:text-brand-700 disabled:opacity-70 dark:hover:text-brand-300"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar borrador
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => guardar(true)}
          className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-brand-800 disabled:opacity-70 dark:bg-brand-600 dark:text-brand-950 dark:hover:bg-brand-500"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          Guardar y timbrar
        </button>
      </div>

      <ConceptoModal
        open={modalAbierto}
        initial={editando}
        onClose={() => setModalAbierto(false)}
        onGuardar={guardarConcepto}
      />

      <Modal
        open={nuevoClienteAbierto}
        onClose={() => setNuevoClienteAbierto(false)}
        title="Nuevo cliente"
        size="lg"
        closeOnOverlayClick={false}
        hero={
          <div className="bg-linear-to-br from-brand-600 to-brand-800 px-6 py-7">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25">
                <UserPlus className="h-5 w-5 text-white" />
              </span>
              <div className="min-w-0 pr-10">
                <p className="font-display text-lg font-bold text-white">Nuevo cliente</p>
                <p className="mt-0.5 text-sm text-white/75">Agrega un cliente de facturación sin salir de la factura</p>
              </div>
            </div>
            <div className="mt-5 h-1 rounded-full bg-aurora-400/70" />
          </div>
        }
      >
        <ContactoForm
          mode="create"
          tipoInicial="cliente"
          tipoBloqueado
          onSuccess={(id) => {
            setNuevoClienteAbierto(false);
            listClientesFacturablesAction().then((lista) => {
              setClientes(lista);
              if (id) {
                setIdContactoFacturacion(String(id));
                aplicarDefaultsCliente(lista.find((c) => c.id === id));
              }
            });
          }}
          onCancel={() => setNuevoClienteAbierto(false)}
        />
      </Modal>

      <Modal
        open={clienteEditando !== null}
        onClose={() => setClienteEditando(null)}
        title="Editar cliente"
        description="Corrige los datos propios de este cliente sin salir de la factura."
        size="lg"
        closeOnOverlayClick={false}
      >
        {clienteEditando && (
          <ContactoForm
            key={clienteEditando.id}
            mode="edit"
            initial={clienteEditando}
            onSuccess={() => {
              setClienteEditando(null);
              listClientesFacturablesAction().then(setClientes);
            }}
            onCancel={() => setClienteEditando(null)}
          />
        )}
      </Modal>
    </div>
  );
}
