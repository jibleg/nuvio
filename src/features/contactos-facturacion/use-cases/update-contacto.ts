import { updateContacto } from "../repositories/contactos-repository";
import type { ContactoMutationResult, UpdateContactoData } from "../types";

export async function updateContactoUseCase(
  id: number,
  data: UpdateContactoData,
  idCliente: number,
): Promise<ContactoMutationResult> {
  await updateContacto(id, idCliente, data);
  return { ok: true, id };
}
