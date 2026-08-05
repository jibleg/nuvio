import { getContactoById } from "@/features/contactos-facturacion";
import { getEmisorDetalle } from "../repositories/emisor-repository";
import { createBorrador } from "../repositories/facturas-repository";
import type { CrearBorradorData, FacturaMutationResult } from "../types";

export async function crearBorradorUseCase(
  idCliente: number,
  idUsuario: number,
  data: CrearBorradorData,
): Promise<FacturaMutationResult> {
  const emisor = await getEmisorDetalle(data.idEmpresaEmisora, idCliente);
  if (!emisor) return { ok: false, error: "Selecciona una empresa emisora válida." };

  const receptor = await getContactoById(data.idContactoFacturacion, idCliente);
  if (!receptor || receptor.tipo !== "cliente") {
    return { ok: false, error: "Selecciona un cliente válido como receptor." };
  }
  if (!receptor.activo) return { ok: false, error: "El cliente seleccionado está inactivo." };

  if (data.conceptos.length === 0) return { ok: false, error: "Agrega al menos un concepto." };

  const id = await createBorrador(idUsuario, data);
  return { ok: true, id };
}
