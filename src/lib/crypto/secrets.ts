import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { env } from "@/lib/env";

/**
 * Cifrado simétrico de secretos en reposo (AES-256-GCM), guardados como
 * columnas `bytea`. Formato binario: `[version(1)][iv(12)][authTag(16)][cifrado(n)]`.
 *
 * Usado para la contraseña de la llave privada del CSD por empresa
 * (`corporativo.empresas.sign_password_enc`) — un secreto distinto por
 * tenant/empresa, a diferencia de las credenciales de Finkok (una sola
 * cuenta Nuvio, viven en variables de entorno, no necesitan este cifrado).
 */

const VERSION = 1;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getKey(): Buffer {
  const key = Buffer.from(env.CSD_ENCRYPTION_KEY, "base64");
  if (key.length !== 32) {
    throw new Error("CSD_ENCRYPTION_KEY debe decodificar a 32 bytes");
  }
  return key;
}

export function encryptSecret(plain: string): Buffer {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([Buffer.from([VERSION]), iv, tag, encrypted]);
}

/** Devuelve `null` si `payload` es nulo o si el descifrado/verificación falla. */
export function decryptSecret(payload: Buffer | Uint8Array | null | undefined): string | null {
  if (!payload || payload.length < 1 + IV_LENGTH + TAG_LENGTH) return null;
  const buf = Buffer.isBuffer(payload) ? payload : Buffer.from(payload);
  if (buf[0] !== VERSION) return null;

  const iv = buf.subarray(1, 1 + IV_LENGTH);
  const tag = buf.subarray(1 + IV_LENGTH, 1 + IV_LENGTH + TAG_LENGTH);
  const encrypted = buf.subarray(1 + IV_LENGTH + TAG_LENGTH);

  try {
    const decipher = createDecipheriv("aes-256-gcm", getKey(), iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    return null;
  }
}
