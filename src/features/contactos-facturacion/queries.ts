import { getContactoDetalle, listContactos } from "./repositories/contactos-repository";
import type { ContactoDetalle, ContactoListItem } from "./types";

export function getContactosList(idCliente: number): Promise<ContactoListItem[]> {
  return listContactos(idCliente);
}

export function getContactoById(id: number, idCliente: number): Promise<ContactoDetalle | null> {
  return getContactoDetalle(id, idCliente);
}
