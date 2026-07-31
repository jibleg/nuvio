"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Truck, Users } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ContactoForm } from "./ContactoForm";
import { getContactoDetalleAction } from "../actions";
import type { ContactoDetalle, ContactoListItem, TipoContacto } from "../types";

export function ContactosAdmin({
  contactos,
  puedeGestionar,
}: {
  contactos: ContactoListItem[];
  puedeGestionar: boolean;
}) {
  const router = useRouter();
  const [filtro, setFiltro] = useState<"todos" | TipoContacto>("todos");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modo, setModo] = useState<"create" | "edit">("create");
  const [tipoNuevo, setTipoNuevo] = useState<TipoContacto>("cliente");
  const [editando, setEditando] = useState<ContactoDetalle | null>(null);
  const [cargandoId, setCargandoId] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  const visibles = useMemo(
    () => (filtro === "todos" ? contactos : contactos.filter((c) => c.tipo === filtro)),
    [contactos, filtro],
  );

  const abrirNuevo = (tipo: TipoContacto) => {
    setModo("create");
    setEditando(null);
    setTipoNuevo(tipo);
    setModalAbierto(true);
  };

  const abrirEdicion = (id: number) => {
    setCargandoId(id);
    startTransition(async () => {
      const detalle = await getContactoDetalleAction(id);
      setCargandoId(null);
      if (!detalle) return;
      setEditando(detalle);
      setModo("edit");
      setModalAbierto(true);
    });
  };

  const alGuardar = () => {
    setModalAbierto(false);
    router.refresh();
  };

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-full border border-line bg-surface p-1 shadow-soft">
          {(["todos", "cliente", "proveedor"] as const).map((opcion) => (
            <button
              key={opcion}
              type="button"
              onClick={() => setFiltro(opcion)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                filtro === opcion
                  ? "bg-brand-700 text-white dark:bg-brand-600 dark:text-brand-950"
                  : "text-ink-soft hover:text-brand-600"
              }`}
            >
              {opcion === "todos" ? "Todos" : opcion === "cliente" ? "Clientes" : "Proveedores"}
            </button>
          ))}
        </div>
        {puedeGestionar && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => abrirNuevo("cliente")}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-brand-800 dark:bg-brand-600 dark:text-brand-950 dark:hover:bg-brand-500"
            >
              <Plus className="h-4 w-4" />
              Nuevo cliente
            </button>
            <button
              type="button"
              onClick={() => abrirNuevo("proveedor")}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-brand-300 hover:text-brand-700 dark:hover:text-brand-300"
            >
              <Plus className="h-4 w-4" />
              Nuevo proveedor
            </button>
          </div>
        )}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-line bg-surface shadow-soft md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wide text-muted">
              <th className="px-5 py-3">Nombre</th>
              <th className="px-5 py-3">RFC</th>
              <th className="px-5 py-3">Tipo</th>
              <th className="px-5 py-3">Contacto</th>
              <th className="px-5 py-3">Estado</th>
              {puedeGestionar && <th className="px-5 py-3 text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {visibles.map((contacto) => (
              <tr key={contacto.id} className="border-b border-line/60 last:border-0 hover:bg-cloud/50">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-white ${
                        contacto.tipo === "cliente"
                          ? "bg-gradient-to-br from-brand-400 to-aurora-500"
                          : "bg-gradient-to-br from-sky-400 to-sky-600"
                      }`}
                    >
                      {contacto.tipo === "cliente" ? (
                        <Users className="h-4 w-4" />
                      ) : (
                        <Truck className="h-4 w-4" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">
                        {contacto.nombreComercial ?? contacto.razonSocial}
                      </p>
                      {contacto.nombreComercial && (
                        <p className="truncate text-xs text-muted">{contacto.razonSocial}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-ink-soft">{contacto.rfc}</td>
                <td className="px-5 py-3.5">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      contacto.tipo === "cliente"
                        ? "bg-brand-50 text-brand-700 dark:text-brand-200"
                        : "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300"
                    }`}
                  >
                    {contacto.tipo === "cliente" ? "Cliente" : "Proveedor"}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-ink-soft">
                  {contacto.telefono || contacto.email ? (
                    <div className="text-xs">
                      {contacto.telefono && <p>{contacto.telefono}</p>}
                      {contacto.email && <p className="truncate">{contacto.email}</p>}
                    </div>
                  ) : (
                    <span className="text-xs text-muted">—</span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      contacto.activo ? "bg-brand-50 text-brand-700 dark:text-brand-200" : "bg-cloud text-muted"
                    }`}
                  >
                    {contacto.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                {puedeGestionar && (
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => abrirEdicion(contacto.id)}
                      disabled={cargandoId === contacto.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-brand-300 hover:text-brand-700 disabled:opacity-60 dark:hover:text-brand-300"
                    >
                      {cargandoId === contacto.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Pencil className="h-3.5 w-3.5" />
                      )}
                      Editar
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {visibles.length === 0 && (
              <tr>
                <td colSpan={puedeGestionar ? 6 : 5} className="px-5 py-8 text-center text-sm text-muted">
                  Sin registros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title={
          modo === "create"
            ? tipoNuevo === "cliente"
              ? "Nuevo cliente"
              : "Nuevo proveedor"
            : "Editar contacto"
        }
        description={
          modo === "create" ? "Agrega un contacto de facturación." : editando?.razonSocial
        }
        size="lg"
        closeOnOverlayClick={false}
      >
        <ContactoForm
          key={modo === "edit" ? `edit-${editando?.id}` : `create-${tipoNuevo}`}
          mode={modo}
          initial={editando ?? undefined}
          tipoInicial={tipoNuevo}
          onSuccess={alGuardar}
          onCancel={() => setModalAbierto(false)}
        />
      </Modal>
    </div>
  );
}
