import { listEmisores } from "./repositories/emisor-repository";
import { getFacturaDetalle, listFacturas } from "./repositories/facturas-repository";
import type { EmisorListItem } from "./repositories/emisor-repository";
import type { FacturaDetalle, FacturaListItem } from "./types";

export function getFacturasList(idCliente: number): Promise<FacturaListItem[]> {
  return listFacturas(idCliente);
}

export function getFacturaById(id: number, idCliente: number): Promise<FacturaDetalle | null> {
  return getFacturaDetalle(id, idCliente);
}

export function getEmisoresList(idCliente: number): Promise<EmisorListItem[]> {
  return listEmisores(idCliente);
}
