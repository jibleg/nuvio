import { X509Certificate } from "node:crypto";
import { leerCertificado, leerLlavePrivada, llaveYCertificadoCoinciden, validarEsCsd } from "@/lib/cfdi/sello";
import { encryptSecret } from "@/lib/crypto/secrets";
import { guardarCsd } from "../repositories/csd-repository";
import type { CsdMutationResult } from "../types";

/**
 * Valida un CSD (certificado + llave privada + contraseña) antes de
 * guardarlo: que sea un CSD del RFC correcto (no una e.firma ni el de otro
 * RFC), que la contraseña abra la llave, y que llave y certificado sean
 * pareja. Un CSD mal armado se detecta aquí, no hasta que el PAC lo rechace
 * gastando un timbre.
 */
export async function subirCsdUseCase(
  idEmpresa: number,
  idCliente: number,
  rfcEmpresa: string,
  data: { cer: Buffer; key: Buffer; password: string },
): Promise<CsdMutationResult> {
  try {
    validarEsCsd(data.cer, rfcEmpresa);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Certificado inválido." };
  }

  let llave;
  try {
    llave = leerLlavePrivada(data.key, data.password);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo leer la llave privada." };
  }

  if (!llaveYCertificadoCoinciden(llave, data.cer)) {
    return { ok: false, error: "El certificado (.cer) y la llave (.key) no son pareja." };
  }

  const certificado = leerCertificado(data.cer);
  const x509 = new X509Certificate(data.cer);

  await guardarCsd(idEmpresa, idCliente, {
    cer: data.cer,
    key: data.key,
    passwordEnc: encryptSecret(data.password),
    numeroCertificado: certificado.numero,
    validoDesde: x509.validFromDate,
    validoHasta: x509.validToDate,
  });

  return { ok: true };
}
