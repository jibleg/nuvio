import { consultarEstatusSat } from "@/lib/finkok/cancel";
import { credencialesFinkok } from "@/lib/finkok/credenciales";
import { actualizarEstatusCancelacion, getFacturaDetalle } from "../repositories/facturas-repository";
import type { CancelarResult } from "../types";

const MENSAJE_ESTATUS: Record<string, string> = {
  cancelada: "La factura ya quedó cancelada ante el SAT.",
  solicitada: "Sigue en proceso: el receptor aún no responde y no ha vencido el plazo de 72 horas.",
  rechazada: "El receptor rechazó la cancelación. La factura sigue vigente.",
  plazo_vencido: "Venció el plazo sin respuesta del receptor. La factura sigue vigente.",
};

/** Mismo criterio que `cancelar-factura.ts`, sin el acuse de un `cancel` recién hecho (aquí solo re-consultamos). */
function estatusFinal(sat: { estado: string | null; estatusCancelacion: string | null }): string {
  const estado = sat.estado ?? "";
  const ec = sat.estatusCancelacion ?? "";
  if (/cancelad/i.test(estado)) return "cancelada";
  if (/rechaz/i.test(ec)) return "rechazada";
  if (/plazo vencido/i.test(ec)) return "plazo_vencido";
  return "solicitada";
}

/**
 * Vuelve a consultar ante el SAT (vía `get_sat_status`, sin re-solicitar la
 * cancelación ni firmar nada con el CSD) el estatus real de una cancelación
 * que quedó "en proceso" — para saber si el receptor ya aceptó/rechazó, o si
 * venció el plazo de 72 horas. Hoy nada dispara esta consulta sola: la
 * solicitud original (`cancelar-factura.ts`) la hace una única vez, en el
 * mismo instante de pedir la cancelación, cuando es prácticamente imposible
 * que el receptor ya haya respondido. Sirve igual para complementos de pago
 * (misma fila de `cfdi.factura`, mismo mecanismo de cancelación).
 */
export async function verificarEstatusCancelacionUseCase(
  idFactura: number,
  idCliente: number,
): Promise<CancelarResult> {
  const detalle = await getFacturaDetalle(idFactura, idCliente);
  if (!detalle) return { ok: false, error: "Documento no encontrado." };
  if (detalle.estatusCancelacion !== "solicitada") {
    return { ok: false, error: "Esta factura no tiene una cancelación en proceso." };
  }
  if (!detalle.folioFiscal || !detalle.emisorRfc || !detalle.receptorRfc) {
    return { ok: false, error: "Faltan datos del comprobante para consultar su estatus." };
  }
  if (!detalle.ambienteTimbrado) {
    return { ok: false, error: "No se pudo determinar el ambiente en el que se timbró este comprobante." };
  }

  const sat = await consultarEstatusSat(credencialesFinkok(detalle.ambienteTimbrado), {
    rfcEmisor: detalle.emisorRfc,
    rfcReceptor: detalle.receptorRfc,
    uuid: detalle.folioFiscal,
    total: detalle.total ?? "0",
  });

  if (!("estado" in sat)) {
    return { ok: false, error: sat.mensaje };
  }

  const estatus = estatusFinal(sat);
  if (estatus !== detalle.estatusCancelacion) {
    await actualizarEstatusCancelacion(idFactura, estatus);
  }

  return { ok: true, mensaje: MENSAJE_ESTATUS[estatus] ?? "Estatus actualizado." };
}
