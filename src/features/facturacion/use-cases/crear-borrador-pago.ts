import { crearBorradorPago as crearBorradorPagoRepo } from "../repositories/pagos-repository";
import type { CrearBorradorPagoResult, DatosPago, DocumentoAPagar } from "../types";

/**
 * Registra un pago (borrador de complemento CFDI tipo P). La validación de
 * tenant/saldo/emisora-receptor compartida vive en el repositorio, dentro de
 * la misma transacción que bloquea los ingresos (`FOR UPDATE`) — separarla
 * aquí obligaría a repetir la consulta fuera del candado y abriría la
 * carrera que ese candado existe para evitar.
 */
export async function crearBorradorPagoUseCase(
  idUsuario: number,
  idCliente: number,
  documentos: DocumentoAPagar[],
  datosPago: DatosPago,
): Promise<CrearBorradorPagoResult> {
  if (documentos.length === 0) return { ok: false, error: "Selecciona al menos una factura para registrar el pago." };
  if (!datosPago.idFormaPago) return { ok: false, error: "Selecciona la forma de pago." };
  if (!datosPago.fechaPago) return { ok: false, error: "Indica la fecha del pago." };

  const resultado = await crearBorradorPagoRepo(idUsuario, idCliente, documentos, datosPago);
  if ("error" in resultado) return { ok: false, error: resultado.error };
  return { ok: true, id: resultado.id };
}
