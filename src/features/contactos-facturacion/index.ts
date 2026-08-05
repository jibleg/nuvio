/**
 * Directorio de clientes y proveedores de facturación (a quién facturas /
 * quién te factura). Vive en `corporativo.contactos_facturacion`, separado
 * de `@/features/sucursales` (tu propia matriz/sucursales). Mutaciones
 * protegidas por el permiso `clientes.write`.
 */
export { getContactosList, getContactoById } from "./queries";
export { ContactosAdmin } from "./components/ContactosAdmin";
export { ContactoForm } from "./components/ContactoForm";
export type { ContactoDetalle, ContactoListItem, TipoContacto } from "./types";
