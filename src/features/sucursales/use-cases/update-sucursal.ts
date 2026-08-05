import { getSucursalDetalle, updateSucursal as updateSucursalRepo } from "../repositories/sucursales-repository";
import type { SucursalMutationResult, UpdateSucursalData } from "../types";

export async function updateSucursalUseCase(
  id: number,
  data: UpdateSucursalData,
  idCliente: number,
): Promise<SucursalMutationResult> {
  const actual = await getSucursalDetalle(id, idCliente);
  if (!actual) return { ok: false, error: "Sucursal no encontrada." };

  // La matriz no hereda de nadie: sus datos fiscales siempre son los propios,
  // capturados directamente en el form (sin el toggle "razón social propia"
  // que sí aplica a sucursales).
  let rfc: string | null;
  let razonSocial: string | null;
  if (actual.esMatriz) {
    if (!data.razonSocialPropia || !data.rfcPropio) {
      return { ok: false, error: "Captura la razón social y el RFC de la empresa." };
    }
    rfc = data.rfcPropio;
    razonSocial = data.razonSocialPropia;
  } else {
    rfc = data.usaFiscalPropio ? data.rfcPropio : null;
    razonSocial = data.usaFiscalPropio ? data.razonSocialPropia : null;
  }

  await updateSucursalRepo(id, idCliente, {
    nombreComercial: data.nombreComercial,
    nombreCorto: data.nombreCorto,
    calle: data.calle,
    colonia: data.colonia,
    ciudad: data.ciudad,
    codigoPostal: data.codigoPostal,
    telefono: data.telefono,
    email: data.email,
    activo: data.activo,
    rfc,
    razonSocial,
  });
  return { ok: true, id };
}
