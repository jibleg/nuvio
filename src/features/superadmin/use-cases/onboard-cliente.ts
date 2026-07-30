import bcrypt from "bcryptjs";
import { existsSlug } from "../repositories/clientes-repository";
import { onboardCliente as onboardClienteRepo } from "../repositories/onboarding-repository";
import type { OnboardClienteData, SuperAdminMutationResult } from "../types";

export async function onboardClienteUseCase(
  data: OnboardClienteData,
): Promise<SuperAdminMutationResult> {
  if (await existsSlug(data.slug)) {
    return { ok: false, error: "Ya existe un cliente con ese slug." };
  }

  const { clienteId } = await onboardClienteRepo({
    ...data,
    passwordHash: bcrypt.hashSync(data.adminPassword, 10),
  });

  return { ok: true, id: clienteId };
}
