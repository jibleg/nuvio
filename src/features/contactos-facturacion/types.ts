/**
 * Cliente o proveedor de facturación = a quién facturas / quién te factura.
 * Vive en `corporativo.contactos_facturacion`, separado a propósito de
 * `corporativo.empresas` (tu propia matriz/sucursales): factura-facil
 * mezclaba ambos conceptos en una sola tabla vía `empresas.tipo`.
 */
export type TipoContacto = "cliente" | "proveedor";

export type ContactoListItem = {
  id: number;
  tipo: TipoContacto;
  razonSocial: string;
  rfc: string;
  nombreComercial: string | null;
  ciudad: string | null;
  telefono: string | null;
  email: string | null;
  activo: boolean;
  /**
   * Datos de facturación por defecto (pestaña "Información de facturación"):
   * prellenan la factura nueva al elegir este cliente, ahí siguen siendo
   * editables. Se exponen ya en el listado (no solo en el detalle) para que
   * `@/features/facturacion` los use sin una consulta aparte por cliente.
   */
  idRegimen: number | null;
  idUso: number | null;
  idFormaPago: number | null;
  idMetodo: number | null;
};

export type ContactoDetalle = ContactoListItem & {
  calle: string | null;
  colonia: string | null;
  codigoPostal: number | null;
};

export type ContactoFormData = {
  tipo: TipoContacto;
  razonSocial: string;
  rfc: string;
  nombreComercial: string | null;
  calle: string | null;
  colonia: string | null;
  ciudad: string | null;
  codigoPostal: number | null;
  telefono: string | null;
  email: string | null;
  idRegimen: number | null;
  idUso: number | null;
  idFormaPago: number | null;
  idMetodo: number | null;
};

export type UpdateContactoData = ContactoFormData & { activo: boolean };

export type ContactoMutationResult =
  | { ok: true; id?: number }
  | { ok: false; error: string };
