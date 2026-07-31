import { createContacto } from "../repositories/contactos-repository";
import type { ContactoFormData, ContactoMutationResult } from "../types";

export async function createContactoUseCase(
  data: ContactoFormData,
  idCliente: number,
): Promise<ContactoMutationResult> {
  const id = await createContacto(idCliente, data);
  return { ok: true, id };
}
