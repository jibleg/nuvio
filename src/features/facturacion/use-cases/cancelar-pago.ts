import { X509Certificate } from "node:crypto";
import { leerLlavePrivada } from "@/lib/cfdi/sello";
import { decryptSecret } from "@/lib/crypto/secrets";
import { cancelarConFinkok, consultarEstatusSat } from "@/lib/finkok/cancel";
import type { CodigoMotivo, EstatusSat } from "@/lib/finkok/cancel-soap";
import { credencialesFinkok, type AmbienteTimbrado } from "@/lib/finkok/credenciales";
import { getEmisorDetalle } from "../repositories/emisor-repository";
import { marcarCancelacion } from "../repositories/facturas-repository";
import { getPagoDetalle } from "../repositories/pagos-repository";
import type { CancelarResult } from "../types";

/** `cfdi.motivo_cancelacion` — estables, no cambian. Un complemento de pago casi siempre se cancela con motivo "02" (sin sustitución). */
const ID_MOTIVO: Record<CodigoMotivo, number> = { "01": 1, "02": 2, "03": 3, "04": 4 };

const MENSAJE_ESTATUS: Record<string, string> = {
  cancelada: "El complemento de pago quedó cancelado ante el SAT.",
  solicitada: "Cancelación en proceso: el receptor tiene hasta 72 horas para aceptarla o rechazarla.",
  rechazada: "El receptor rechazó la cancelación. El complemento sigue vigente.",
  plazo_vencido: "Venció el plazo sin respuesta del receptor. El complemento sigue vigente.",
};

function estatusFinal(sat: EstatusSat | null, estatusUuid: string | null): string {
  const estado = sat?.estado ?? "";
  const ec = sat?.estatusCancelacion ?? "";
  if (/cancelad/i.test(estado)) return "cancelada";
  if (/en proceso/i.test(ec)) return "solicitada";
  if (/rechaz/i.test(ec)) return "rechazada";
  if (/plazo vencido/i.test(ec)) return "plazo_vencido";
  if (estatusUuid === "201" || estatusUuid === "202") return "cancelada";
  return "solicitada";
}

/**
 * Cancela un complemento de pago timbrado. Calcado de `cancelar-factura.ts`
 * (mismo PAC, mismo flujo de firma con el CSD) — el comprobante de pago es
 * otra fila de `cfdi.factura`, así que `marcarCancelacion` (genérica por id)
 * se reutiliza tal cual. Al cancelarse, el saldo de los ingresos que
 * liquidaba vuelve a aparecer en "por pagar" (`listFacturasPorPagar` excluye
 * los complementos con `estatusCancelacion = 'cancelada'`).
 */
export async function cancelarPagoUseCase(
  idPago: number,
  idCliente: number,
  ambiente: AmbienteTimbrado,
  motivo: CodigoMotivo,
): Promise<CancelarResult> {
  const pagoDetalle = await getPagoDetalle(idPago, idCliente);
  if (!pagoDetalle) return { ok: false, error: "Complemento de pago no encontrado." };
  if (pagoDetalle.estado !== "timbrada") {
    return { ok: false, error: "Solo se puede cancelar un complemento de pago timbrado y vigente." };
  }
  if (!pagoDetalle.folioFiscal) return { ok: false, error: "Este complemento no tiene folio fiscal." };

  const emisor = await getEmisorDetalle(pagoDetalle.idEmpresaEmisora, idCliente);
  if (!emisor || !emisor.csd) return { ok: false, error: "No se encontró el CSD de la empresa emisora." };
  const csd = emisor.csd;

  const password = decryptSecret(csd.passwordEnc);
  if (!password) return { ok: false, error: "No se pudo descifrar la contraseña del CSD." };

  let llave;
  try {
    llave = leerLlavePrivada(csd.key, password);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo leer la llave privada del CSD." };
  }

  const cerPem = new X509Certificate(csd.cer).toString();
  const keyPem = llave.export({ format: "pem", type: "pkcs8" }).toString();
  const creds = credencialesFinkok(ambiente);

  const respuesta = await cancelarConFinkok(creds, {
    uuid: pagoDetalle.folioFiscal,
    motivo,
    folioSustitucion: "",
    rfcEmisor: emisor.rfc,
    cerB64: Buffer.from(cerPem).toString("base64"),
    keyB64: Buffer.from(keyPem).toString("base64"),
  });

  if (!respuesta.ok && !respuesta.estatusUuid) {
    return { ok: false, error: respuesta.mensaje ?? "El PAC rechazó la solicitud de cancelación." };
  }

  // El comprobante de pago siempre declara Total="0" (no factura importes).
  const sat = await consultarEstatusSat(creds, {
    rfcEmisor: emisor.rfc,
    rfcReceptor: pagoDetalle.receptorRfc ?? "",
    uuid: pagoDetalle.folioFiscal,
    total: "0",
  });
  const satDatos = "estado" in sat ? sat : null;
  const estatus = estatusFinal(satDatos, respuesta.estatusUuid);

  await marcarCancelacion(idPago, {
    estatus,
    idMotivoCancelacion: ID_MOTIVO[motivo],
    fechaCancelacion: respuesta.fecha,
    folioSustitucion: null,
    acuse: respuesta.acuse,
  });

  return { ok: true, mensaje: MENSAJE_ESTATUS[estatus] ?? "Solicitud de cancelación procesada." };
}
