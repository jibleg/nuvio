import { updateCliente } from "../repositories/clientes-repository";
import type { SuperAdminMutationResult, UpdateClienteData } from "../types";

export async function updateClienteUseCase(
  id: number,
  data: UpdateClienteData,
): Promise<SuperAdminMutationResult> {
  await updateCliente(id, data);
  return { ok: true, id };
}
