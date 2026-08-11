import {
  getClienteDetalle,
  getStats,
  listClientes,
} from "./repositories/clientes-repository";
import { getSuperAdminDetalle, listSuperAdmins } from "./repositories/super-admins-repository";
import type { ClienteDetalle, ClienteListItem, StaffDetalle, StaffListItem, SuperAdminStats } from "./types";

export function getClientesList(): Promise<ClienteListItem[]> {
  return listClientes();
}

export function getClienteById(id: number): Promise<ClienteDetalle | null> {
  return getClienteDetalle(id);
}

export function getSuperAdminStats(): Promise<SuperAdminStats> {
  return getStats();
}

export function getStaffList(): Promise<StaffListItem[]> {
  return listSuperAdmins();
}

export function getStaffById(id: number): Promise<StaffDetalle | null> {
  return getSuperAdminDetalle(id);
}
