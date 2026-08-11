import bcrypt from "bcryptjs";
import { setSuperAdminPassword } from "../repositories/super-admins-repository";
import type { SuperAdminMutationResult } from "../types";

/** Restablece la contraseña de una cuenta de staff. */
export async function resetStaffPasswordUseCase(
  id: number,
  password: string,
): Promise<SuperAdminMutationResult> {
  await setSuperAdminPassword(id, bcrypt.hashSync(password, 10));
  return { ok: true, id };
}
