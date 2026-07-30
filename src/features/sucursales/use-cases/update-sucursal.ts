import { updateSucursal as updateSucursalRepo } from "../repositories/sucursales-repository";
import type { SucursalMutationResult, UpdateSucursalData } from "../types";

export async function updateSucursalUseCase(
  id: number,
  data: UpdateSucursalData,
  idCliente: number,
): Promise<SucursalMutationResult> {
  await updateSucursalRepo(id, idCliente, data);
  return { ok: true, id };
}
