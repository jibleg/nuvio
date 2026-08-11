import bcrypt from "bcryptjs";
import { createSuperAdmin, existsSuperAdminEmail } from "../repositories/super-admins-repository";
import type { CrearStaffData, SuperAdminMutationResult } from "../types";

/** Alta de una cuenta de staff con acceso a `/superadmin`. */
export async function createStaffUseCase(data: CrearStaffData): Promise<SuperAdminMutationResult> {
  if (await existsSuperAdminEmail(data.email)) {
    return { ok: false, error: "Ya existe una cuenta de staff con ese correo." };
  }

  const id = await createSuperAdmin({
    nombre: data.nombre,
    email: data.email,
    passwordHash: bcrypt.hashSync(data.password, 10),
  });
  return { ok: true, id };
}
