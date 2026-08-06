import { createBorrador, getFacturaDetalle } from "../repositories/facturas-repository";
import type { ConceptoInput, FacturaMutationResult } from "../types";

/** `CfdiRelacionados/@TipoRelacion` — sustitución de los CFDI previos (el único que emite Nuvio). */
const TIPO_RELACION_SUSTITUCION = "04";

/**
 * Refacturar = crear un borrador nuevo, clon de una factura timbrada, ligado
 * a ella por `CfdiRelacionados` (tipo "04"). NO cancela la original: el
 * orden correcto ante el SAT es timbrar primero el sustituto y solo después
 * cancelar el original con motivo "01" y el folio del sustituto ya
 * timbrado — `cancelar-factura.ts` bloquea el orden inverso. El borrador
 * queda editable como cualquier otro antes de timbrarlo (por si la
 * corrección implica cambiar algún concepto).
 */
export async function refacturarUseCase(
  idFacturaOriginal: number,
  idCliente: number,
  idUsuario: number,
): Promise<FacturaMutationResult> {
  const original = await getFacturaDetalle(idFacturaOriginal, idCliente);
  if (!original) return { ok: false, error: "Factura original no encontrada." };
  if (original.estado !== "timbrada") {
    return { ok: false, error: "Solo se puede refacturar una factura timbrada y vigente." };
  }
  if (!original.folioFiscal) return { ok: false, error: "La factura original no tiene folio fiscal." };

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
    cfdiRelacionado: original.folioFiscal,
    tipoRelacion: TIPO_RELACION_SUSTITUCION,
  });

  return { ok: true, id };
}
