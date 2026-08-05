/**
 * Emisión y timbrado de CFDI 4.0 (factura de Ingreso, PAC Finkok). El emisor
 * siempre es una empresa propia con identidad fiscal (`@/features/sucursales`);
 * el receptor siempre es un contacto de facturación
 * (`@/features/contactos-facturacion`). Mutaciones protegidas por el permiso
 * `facturas.write`; lectura por `facturas.consulta`.
 */
export { getFacturasList, getFacturaById } from "./queries";
export { FacturasListado } from "./components/FacturasListado";
export { FacturaForm } from "./components/FacturaForm";
export { FacturaDetalleView } from "./components/FacturaDetalleView";
export type { FacturaDetalle, FacturaListItem } from "./types";
