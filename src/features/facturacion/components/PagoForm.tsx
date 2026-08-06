"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Banknote, Loader2, Save, User } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { ROUTES } from "@/config/routes";
import type { ContactoListItem } from "@/features/contactos-facturacion";
import type { CatalogoItem } from "@/lib/cfdi/catalogos";
import {
  crearBorradorPagoAction,
  listCatalogosFacturaAction,
  listClientesFacturablesAction,
  listFacturasPorPagarAction,
} from "../actions";
import type { FacturaPorPagar } from "../types";

const inputClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-all placeholder:text-muted focus:border-brand-400 focus:ring-4 focus:ring-brand-400/20";
const labelClass = "mb-1.5 block text-sm font-semibold text-ink-soft";
const sectionHeader = "flex items-center gap-2";

const formatoMoneda = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

function hoy(): string {
  return new Date().toISOString().slice(0, 10);
}

export function PagoForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contactoInicial = searchParams.get("contacto");

  const [clientes, setClientes] = useState<ContactoListItem[]>([]);
  const [formasPago, setFormasPago] = useState<CatalogoItem[]>([]);
  const [idContacto, setIdContacto] = useState(contactoInicial ?? "");
  const [facturas, setFacturas] = useState<FacturaPorPagar[]>([]);
  const [cargandoFacturas, setCargandoFacturas] = useState(false);

  const [idFormaPago, setIdFormaPago] = useState("");
  const [fechaPago, setFechaPago] = useState(hoy());
  const [numeroOperacion, setNumeroOperacion] = useState("");
  const [importes, setImportes] = useState<Record<number, string>>({});

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    listClientesFacturablesAction().then(setClientes);
    listCatalogosFacturaAction().then((c) => setFormasPago(c.formasPago));
  }, []);

  useEffect(() => {
    if (!idContacto) {
      setFacturas([]);
      return;
    }
    setCargandoFacturas(true);
    listFacturasPorPagarAction(Number(idContacto)).then((lista) => {
      setFacturas(lista);
      setImportes(Object.fromEntries(lista.map((f) => [f.id, f.saldo.toFixed(2)])));
      setCargandoFacturas(false);
    });
  }, [idContacto]);

  const total = useMemo(
    () => Object.values(importes).reduce((t, v) => t + (Number(v) || 0), 0),
    [importes],
  );

  function validar(): string | null {
    if (!idContacto) return "Selecciona el cliente.";
    if (facturas.length === 0) return "Este cliente no tiene facturas a crédito con saldo pendiente.";
    if (!idFormaPago) return "Selecciona la forma de pago.";
    if (!fechaPago) return "Indica la fecha del pago.";
    for (const f of facturas) {
      const abono = Number(importes[f.id]) || 0;
      if (abono <= 0) return `El abono de la factura ${f.serie ?? ""}${f.folio ?? ""} debe ser mayor a cero.`;
      if (abono > f.saldo + 0.009) {
        return `El abono de la factura ${f.serie ?? ""}${f.folio ?? ""} excede su saldo (${formatoMoneda.format(f.saldo)}).`;
      }
    }
    return null;
  }

  const registrar = () => {
    const mensaje = validar();
    if (mensaje) {
      setError(mensaje);
      return;
    }
    setError(null);
    startTransition(async () => {
      const documentos = facturas.map((f) => ({ idFactura: f.id, importePagado: Number(importes[f.id]) || 0 }));
      const result = await crearBorradorPagoAction(documentos, {
        idFormaPago: Number(idFormaPago),
        fechaPago,
        numeroOperacion,
        cuentaOrdenante: null,
        cuentaBeneficiario: null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`${ROUTES.facturacion}/pagos/${result.id}`);
      router.refresh();
    });
  };

  return (
    <div className="space-y-5">
      <Card
        title={
          <span className={sectionHeader}>
            <User className="h-4 w-4 shrink-0 text-brand-600" />
            Cliente
          </span>
        }
        bodyClassName="p-5"
      >
        <SearchableSelect
          value={idContacto}
          onChange={setIdContacto}
          searchPlaceholder="Buscar cliente…"
          options={clientes.map((c) => ({ value: String(c.id), label: c.nombreComercial ?? c.razonSocial, sublabel: c.rfc }))}
        />
      </Card>

      {idContacto && (
        <Card
          title={
            <span className={sectionHeader}>
              <Banknote className="h-4 w-4 shrink-0 text-brand-600" />
              Facturas por pagar
            </span>
          }
          bodyClassName="p-5"
        >
          {cargandoFacturas ? (
            <p className="text-sm text-muted">Buscando facturas con saldo pendiente…</p>
          ) : facturas.length === 0 ? (
            <EmptyState
              icon={Banknote}
              title="Sin saldo pendiente"
              description="Este cliente no tiene facturas a crédito (PPD) con saldo por cobrar."
            />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <span className={labelClass}>Forma de pago</span>
                  <select className={inputClass} value={idFormaPago} onChange={(e) => setIdFormaPago(e.target.value)}>
                    <option value="">Selecciona…</option>
                    {formasPago.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.clave} — {f.descripcion ?? f.clave}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className={labelClass}>Fecha del pago</span>
                  <input type="date" className={inputClass} value={fechaPago} onChange={(e) => setFechaPago(e.target.value)} />
                </div>
                <div>
                  <span className={labelClass}>
                    Referencia <span className="font-normal text-muted">(opcional)</span>
                  </span>
                  <input
                    className={inputClass}
                    value={numeroOperacion}
                    onChange={(e) => setNumeroOperacion(e.target.value)}
                    placeholder="Núm. de operación"
                  />
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-line">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line bg-cloud/40 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                      <th className="px-4 py-2.5">Factura</th>
                      <th className="px-4 py-2.5 text-center">Parcialidad</th>
                      <th className="px-4 py-2.5 text-right">Saldo</th>
                      <th className="px-4 py-2.5 text-right">Abono</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facturas.map((f) => (
                      <tr key={f.id} className="border-b border-line/60 last:border-0">
                        <td className="px-4 py-3">
                          <p className="font-medium text-ink">
                            {f.serie ?? ""}
                            {f.folio ?? ""}
                          </p>
                          <p className="font-mono text-xs text-muted">{f.folioFiscal}</p>
                        </td>
                        <td className="px-4 py-3 text-center text-ink-soft">{f.siguienteParcialidad}</td>
                        <td className="px-4 py-3 text-right text-ink-soft">{formatoMoneda.format(f.saldo)}</td>
                        <td className="px-4 py-3 text-right">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={importes[f.id] ?? ""}
                            onChange={(e) => setImportes((prev) => ({ ...prev, [f.id]: e.target.value }))}
                            className={`${inputClass} w-32 text-right`}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-cloud/40 font-semibold text-ink">
                      <td className="px-4 py-2.5" colSpan={3}>
                        Monto total del pago
                      </td>
                      <td className="px-4 py-2.5 text-right">{formatoMoneda.format(total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </Card>
      )}

      {error && (
        <p className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-sm font-medium text-red-500">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      {idContacto && facturas.length > 0 && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isPending}
            onClick={registrar}
            className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-brand-800 disabled:opacity-70 dark:bg-brand-600 dark:text-brand-950 dark:hover:bg-brand-500"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Registrar pago
          </button>
        </div>
      )}
    </div>
  );
}
