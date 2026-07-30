import { getPlan, type PlanKey } from "@/config/plans";
import { countEmpresas, createSucursal as createSucursalRepo, findMatriz } from "../repositories/sucursales-repository";
import type { SucursalFormData, SucursalMutationResult } from "../types";

export async function createSucursalUseCase(
  data: SucursalFormData,
  idCliente: number,
  planKey: PlanKey,
): Promise<SucursalMutationResult> {
  const matriz = await findMatriz(idCliente);
  if (!matriz) return { ok: false, error: "Este cliente no tiene una empresa matriz." };

  const plan = getPlan(planKey);
  if (plan && plan.maxEmpresas !== null) {
    const total = await countEmpresas(idCliente);
    if (total >= plan.maxEmpresas) {
      return {
        ok: false,
        error: `Tu plan ${plan.nombre} permite hasta ${plan.maxEmpresas} empresa(s) (matriz + sucursales).`,
      };
    }
  }

  const id = await createSucursalRepo({
    idCliente,
    idEmpresaMatriz: matriz.id,
    rfc: matriz.rfc,
    razonSocial: matriz.razonSocial,
    form: data,
  });
  return { ok: true, id };
}
