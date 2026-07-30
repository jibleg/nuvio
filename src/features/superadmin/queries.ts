import {
  getClienteDetalle,
  getStats,
  listClientes,
} from "./repositories/clientes-repository";
import type { ClienteDetalle, ClienteListItem, SuperAdminStats } from "./types";

export function getClientesList(): Promise<ClienteListItem[]> {
  return listClientes();
}

export function getClienteById(id: number): Promise<ClienteDetalle | null> {
  return getClienteDetalle(id);
}

export function getSuperAdminStats(): Promise<SuperAdminStats> {
  return getStats();
}
