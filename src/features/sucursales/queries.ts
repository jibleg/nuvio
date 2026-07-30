import { getSucursalDetalle, listSucursales } from "./repositories/sucursales-repository";
import type { SucursalDetalle, SucursalListItem } from "./types";

export function getSucursalesList(idCliente: number): Promise<SucursalListItem[]> {
  return listSucursales(idCliente);
}

export function getSucursalById(id: number, idCliente: number): Promise<SucursalDetalle | null> {
  return getSucursalDetalle(id, idCliente);
}
