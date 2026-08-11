import { X509Certificate } from "node:crypto";
import { getContactoById } from "@/features/contactos-facturacion";
import { leerLlavePrivada } from "@/lib/cfdi/sello";
import { decryptSecret } from "@/lib/crypto/secrets";
import { cancelarConFinkok, consultarEstatusSat } from "@/lib/finkok/cancel";
import type { CodigoMotivo, EstatusSat } from "@/lib/finkok/cancel-soap";
import { credencialesFinkok } from "@/lib/finkok/credenciales";
import { getEmisorDetalle } from "../repositories/emisor-repository";
import { existeFacturaTimbradaConFolioFiscal, getFacturaDetalle, marcarCancelacion } from "../repositories/facturas-repository";
import type { CancelarResult } from "../types";

/** `cfdi.motivo_cancelacion` — estables, no cambian. */
const ID_MOTIVO: Record<CodigoMotivo, number> = { "01": 1, "02": 2, "03": 3, "04": 4 };

const MENSAJE_ESTATUS: Record<string, string> = {
  cancelada: "La factura quedó cancelada ante el SAT.",
  solicitada: "Cancelación en proceso: el receptor tiene hasta 72 horas para aceptarla o rechazarla.",
  rechazada: "El receptor rechazó la cancelación. La factura sigue vigente.",
  plazo_vencido: "Venció el plazo sin respuesta del receptor. La factura sigue vigente.",
};

/**
 * Traduce lo que dice el SAT (o, en su defecto, el acuse del PAC) al estado
 * que se guarda. Un `cancel` aceptado no siempre es una cancelación
 * consumada: si el comprobante requiere aceptación del receptor, el SAT la
 * deja "en proceso" hasta que la acepte, la rechace, o venza el plazo.
 */
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
 * Cancela una factura timbrada. A diferencia del timbrado, Finkok firma la
 * cancelación con el CSD directamente (recibe cer/key en PEM, no aquí, ver
 * `@/lib/finkok/cancel-soap`): la llave se descifra aquí una sola vez para
 * exportarla a PEM sin passphrase, que es lo que el PAC exige.
 *
 * El ambiente NO se recalcula desde la sucursal: se usa el que quedó grabado
 * en la factura al timbrarla (`facturaDetalle.ambienteTimbrado`). El toggle
 * por sucursal (`@/features/sucursales`) puede haber cambiado desde entonces
 * — cancelar tiene que ir al mismo ambiente de Finkok donde vive el UUID.
 */
export async function cancelarFacturaUseCase(
  idFactura: number,
  idCliente: number,
  motivo: CodigoMotivo,
  folioSustitucion: string | null,
): Promise<CancelarResult> {
  const facturaDetalle = await getFacturaDetalle(idFactura, idCliente);
  if (!facturaDetalle) return { ok: false, error: "Factura no encontrada." };
  if (facturaDetalle.estado !== "timbrada") {
    return { ok: false, error: "Solo se puede cancelar una factura timbrada y vigente." };
  }
  if (!facturaDetalle.folioFiscal) return { ok: false, error: "Esta factura no tiene folio fiscal." };
  if (!facturaDetalle.ambienteTimbrado) {
    return { ok: false, error: "No se pudo determinar el ambiente en el que se timbró esta factura." };
  }
  const ambiente = facturaDetalle.ambienteTimbrado;
  if (motivo === "01") {
    if (!folioSustitucion) {
      return { ok: false, error: "El motivo 01 requiere el folio fiscal que sustituye a esta factura." };
    }
    // El sustituto debe existir y estar YA TIMBRADO antes de cancelar: es el
    // orden que exige el SAT (timbrar el sustituto, luego cancelar el
    // original con su folio) y evita capturar a mano un UUID inventado.
    const existeSustituto = await existeFacturaTimbradaConFolioFiscal(folioSustitucion, idCliente);
    if (!existeSustituto) {
      return {
        ok: false,
        error:
          "El folio fiscal de sustitución no corresponde a ninguna factura ya timbrada en Nuvio. Timbra primero el CFDI que sustituye a esta factura y usa su folio fiscal.",
      };
    }
  }

  const emisor = await getEmisorDetalle(facturaDetalle.idEmpresaEmisora, idCliente);
  if (!emisor || !emisor.csd) return { ok: false, error: "No se encontró el CSD de la empresa emisora." };
  const csd = emisor.csd;

  const receptor = await getContactoById(facturaDetalle.idContactoFacturacion, idCliente);
  if (!receptor) return { ok: false, error: "No se pudo resolver el cliente receptor." };

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
    uuid: facturaDetalle.folioFiscal,
    motivo,
    folioSustitucion: motivo === "01" ? (folioSustitucion ?? "") : "",
    rfcEmisor: emisor.rfc,
    cerB64: Buffer.from(cerPem).toString("base64"),
    keyB64: Buffer.from(keyPem).toString("base64"),
  });

  if (!respuesta.ok && !respuesta.estatusUuid) {
    return { ok: false, error: respuesta.mensaje ?? "El PAC rechazó la solicitud de cancelación." };
  }

  const sat = await consultarEstatusSat(creds, {
    rfcEmisor: emisor.rfc,
    rfcReceptor: receptor.rfc,
    uuid: facturaDetalle.folioFiscal,
    total: facturaDetalle.total ?? "0",
  });
  const satDatos = "estado" in sat ? sat : null;
  const estatus = estatusFinal(satDatos, respuesta.estatusUuid);

  await marcarCancelacion(idFactura, {
    estatus,
    idMotivoCancelacion: ID_MOTIVO[motivo],
    fechaCancelacion: respuesta.fecha,
    folioSustitucion: motivo === "01" ? folioSustitucion : null,
    acuse: respuesta.acuse,
  });

  return { ok: true, mensaje: MENSAJE_ESTATUS[estatus] ?? "Solicitud de cancelación procesada." };
}
