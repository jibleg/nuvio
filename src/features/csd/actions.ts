"use server";

import { revalidatePath } from "next/cache";
import { ROUTES } from "@/config/routes";
import { requirePermission } from "@/features/auth";
import { getCsdDetalle } from "./repositories/csd-repository";
import { subirCsdUseCase } from "./use-cases/subir-csd";
import type { CsdDetalle, CsdMutationResult } from "./types";

const MANAGE = "empresas.write";

export async function getCsdDetalleAction(idEmpresa: number): Promise<CsdDetalle | null> {
  const session = await requirePermission(MANAGE);
  return getCsdDetalle(idEmpresa, session.cliente.id);
}

export async function subirCsdAction(
  idEmpresa: number,
  rfcEmpresa: string,
  formData: FormData,
): Promise<CsdMutationResult> {
  const session = await requirePermission(MANAGE);

  const cer = formData.get("cer");
  const key = formData.get("key");
  const password = formData.get("password");
  if (!(cer instanceof File) || !(key instanceof File) || typeof password !== "string" || !password) {
    return { ok: false, error: "Adjunta el .cer, el .key y captura la contraseña de la llave." };
  }

  const result = await subirCsdUseCase(idEmpresa, session.cliente.id, rfcEmpresa, {
    cer: Buffer.from(await cer.arrayBuffer()),
    key: Buffer.from(await key.arrayBuffer()),
    password,
  });
  if (result.ok) revalidatePath(ROUTES.sucursales);
  return result;
}
