import { createBorrador, getFacturaDetalle } from "../repositories/facturas-repository";
import type { ConceptoInput, FacturaMutationResult } from "../types";

/**
 * Recurrir = crear un borrador nuevo, clon de una factura timbrada y
 * vigente, SIN relación CFDI hacia ella (a diferencia de refacturar, que
 * sustituye — ver `refacturar.ts`): es una factura independiente para un
 * periodo distinto, pensada para servicios recurrentes (mensual, bimestral,
 * etc.) que se emiten a mano cada vez. Por eso no hay candado de "una sola
 * vez": la misma factura se puede recurrir tantas veces como periodos se
 * facturen. El borrador queda editable (emisor, receptor, conceptos) como
 * cualquier otro antes de timbrarlo.
 */
export async function recurrirFacturaUseCase(
  idFacturaOriginal: number,
  idCliente: number,
  idUsuario: number,
): Promise<FacturaMutationResult> {
  const original = await getFacturaDetalle(idFacturaOriginal, idCliente);
  if (!original) return { ok: false, error: "Factura original no encontrada." };
  if (original.estado !== "timbrada") {
    return { ok: false, error: "Solo se puede recurrir una factura timbrada y vigente." };
  }

  const conceptos: ConceptoInput[] = original.conceptos.map(({ importe: _importe, ...c }) => c);

  const id = await createBorrador(idUsuario, {
    idEmpresaEmisora: original.idEmpresaEmisora,
    idContactoFacturacion: original.idContactoFacturacion,
    idUso: original.idUso,
    idFormaPago: original.idFormaPago,
    idMetodo: original.idMetodo,
    idMoneda: original.idMoneda,
    observacion: original.observacion,
    conceptos,
  });

  return { ok: true, id };
}
