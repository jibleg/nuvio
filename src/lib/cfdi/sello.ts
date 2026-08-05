import "server-only";
import crypto from "node:crypto";

/**
 * Sellado local del CFDI con el CSD de la empresa emisora.
 *
 * Decisión del usuario: la llave privada **no se sube al PAC**; el comprobante
 * se sella aquí y a Finkok solo viaja el XML ya sellado.
 *
 * No hace falta ninguna librería de criptografía: Node lee de forma nativa el
 * `.cer` (DER X.509) y la `.key` (PKCS#8 cifrada) que el SAT entrega, tal como
 * ya hace la validación del CSD en el alta de empresas.
 */

/** Firma RSA que exige el CFDI 4.0. */
const ALGORITMO = "RSA-SHA256";

export interface CertificadoCsd {
  /** Número de certificado de 20 dígitos que va en el atributo `NoCertificado`. */
  numero: string;
  /** El `.cer` en base64, tal cual va en el atributo `Certificado`. */
  base64: string;
}

/**
 * Lee la llave privada del CSD.
 *
 * La `.key` del SAT viene en PKCS#8 cifrada con la contraseña que el
 * contribuyente eligió al tramitarla.
 */
export function leerLlavePrivada(key: Buffer, password: string): crypto.KeyObject {
  try {
    return crypto.createPrivateKey({ key, format: "der", type: "pkcs8", passphrase: password });
  } catch {
    // El error de OpenSSL es críptico ("bad decrypt"); casi siempre es la contraseña.
    throw new Error("No se pudo abrir la llave privada del CSD. Revisa que la contraseña de la .key sea la correcta.");
  }
}

/**
 * Lee el certificado del CSD y devuelve lo que el XML necesita de él.
 *
 * El SAT numera sus certificados con el número de serie del X.509, que viene
 * codificado como texto: cada byte es el carácter ASCII de un dígito.
 */
export function leerCertificado(cer: Buffer): CertificadoCsd {
  let x509: crypto.X509Certificate;
  try {
    x509 = new crypto.X509Certificate(cer);
  } catch {
    throw new Error("No se pudo leer el certificado (.cer) del CSD.");
  }
  return {
    numero: numeroDeCertificadoSat(x509.serialNumber),
    base64: cer.toString("base64"),
  };
}

/**
 * Convierte el número de serie hexadecimal del X.509 al número de 20 dígitos del
 * SAT: `3030...` → `00001000...`. Cada par hex es el código ASCII de un dígito.
 */
export function numeroDeCertificadoSat(serialHex: string): string {
  const bytes = serialHex.match(/../g) ?? [];
  return bytes.map((b) => String.fromCharCode(parseInt(b, 16))).join("");
}

/** Sella la cadena original con la llave privada. Devuelve el sello en base64. */
export function sellar(cadena: string, llave: crypto.KeyObject): string {
  return crypto.createSign(ALGORITMO).update(cadena, "utf8").sign(llave, "base64");
}

/**
 * Verifica un sello contra la llave pública del certificado.
 *
 * No se usa al timbrar (el PAC valida por su cuenta), pero es la única forma de
 * comprobar que la cadena original y el sellado son correctos **antes** de gastar
 * un timbre, así que el timbrado lo usa como autocomprobación.
 */
export function verificarSello(cadena: string, sello: string, cer: Buffer): boolean {
  const publica = new crypto.X509Certificate(cer).publicKey;
  return crypto.createVerify(ALGORITMO).update(cadena, "utf8").verify(publica, Buffer.from(sello, "base64"));
}

/**
 * Comprueba que la llave privada y el certificado sean pareja.
 *
 * Un CSD mal armado (la .key de un certificado y el .cer de otro) sella sin
 * error y el SAT lo rechaza hasta el final. Firmar un texto de prueba y
 * verificarlo con el certificado lo detecta antes de salir a la red.
 */
export function llaveYCertificadoCoinciden(llave: crypto.KeyObject, cer: Buffer): boolean {
  const prueba = "nuvio-csd-check";
  const firma = crypto.createSign(ALGORITMO).update(prueba, "utf8").sign(llave, "base64");
  return verificarSello(prueba, firma, cer);
}

/**
 * Comprueba que un `.cer` sea un CSD (Certificado de Sello Digital) del RFC de
 * la empresa, y no una e.firma (FIEL) del representante legal ni el CSD de
 * otro RFC.
 *
 * El SAT solo acepta un CSD para timbrar; una FIEL sella sin error técnico
 * (la llave y el certificado sí son pareja) pero el PAC la rechaza hasta que
 * intenta timbrar de verdad ("El certificado no es de tipo CSD"), gastando el
 * intento. Dos huellas la delatan sin tener que llamar al SAT:
 *  - **Extended Key Usage**: el SAT no se lo pone a un CSD (es exclusivo para
 *    sellar CFDI); una FIEL sí lo trae (`clientAuth`/`emailProtection`, para
 *    autenticarse y firmar correo), aunque la suba el representante legal a
 *    nombre de la empresa.
 *  - **RFC del `Subject`**: el CSD de una persona moral trae solo su RFC en
 *    `x500UniqueIdentifier`; la FIEL de quien la representa trae
 *    "RFC_empresa / RFC_representante". Si el primer tramo no coincide con el
 *    RFC de la empresa, es el CSD de otro RFC (o esa misma FIEL de otro
 *    representante).
 */
export function validarEsCsd(cer: Buffer, rfcEmpresa: string): void {
  let x509: crypto.X509Certificate;
  try {
    x509 = new crypto.X509Certificate(cer);
  } catch {
    throw new Error("No se pudo leer el certificado (.cer).");
  }

  if (x509.keyUsage && x509.keyUsage.length > 0) {
    throw new Error(
      "El certificado no es de tipo CSD (parece una e.firma/FIEL). Sube el Certificado de Sello Digital tramitado para el RFC de la empresa, no la e.firma del representante legal.",
    );
  }

  const rfcCertificado = rfcDelSubject(x509.subject);
  if (!rfcCertificado) {
    throw new Error("No se pudo identificar el RFC del certificado (.cer).");
  }
  if (rfcCertificado !== rfcEmpresa.trim().toUpperCase()) {
    throw new Error(
      `El certificado corresponde al RFC ${rfcCertificado}, pero la empresa tiene el RFC ${rfcEmpresa.trim().toUpperCase()}. Sube el CSD tramitado para el RFC de esta empresa.`,
    );
  }
}

/**
 * Extrae el RFC de `x500UniqueIdentifier` en el `Subject` del certificado. En
 * una FIEL de representante legal ese campo trae "RFC_empresa /
 * RFC_representante"; el primer tramo es el que corresponde comparar.
 */
function rfcDelSubject(subject: string): string | null {
  const linea = subject.split("\n").find((l) => l.startsWith("x500UniqueIdentifier="));
  if (!linea) return null;
  const rfc = linea.slice("x500UniqueIdentifier=".length).split("/")[0]?.trim().toUpperCase();
  return rfc || null;
}
