/**
 * Backfill único: cifra `corporativo.empresas.sign_password` (texto plano,
 * heredado de factura-facil) hacia `sign_password_enc` (AES-256-GCM) y limpia
 * la columna vieja. Ver migración `0009_facturacion_schema.sql` y
 * `src/lib/crypto/secrets.ts` (mismo formato binario, reimplementado aquí de
 * forma independiente para no depender de `@/lib/env`, que exige variables —
 * como las de Finkok— que este script no necesita).
 *
 * Uso (una sola vez, documentado — no es parte del runtime de la app):
 *   node --env-file=.env.local -e "require('tsx/cjs')" scripts/backfill-csd-password.ts
 *   # o más simple, si `tsx` está disponible como binario:
 *   npx tsx --env-file=.env.local scripts/backfill-csd-password.ts
 */

import { createCipheriv, randomBytes } from "node:crypto";
import postgres from "postgres";

const VERSION = 1;
const IV_LENGTH = 12;

function encryptSecret(plain: string, key: Buffer): Buffer {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([Buffer.from([VERSION]), iv, tag, encrypted]);
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const encryptionKeyB64 = process.env.CSD_ENCRYPTION_KEY;
  if (!databaseUrl) throw new Error("Falta DATABASE_URL en el entorno.");
  if (!encryptionKeyB64) throw new Error("Falta CSD_ENCRYPTION_KEY en el entorno.");

  const key = Buffer.from(encryptionKeyB64, "base64");
  if (key.length !== 32) throw new Error("CSD_ENCRYPTION_KEY debe decodificar a 32 bytes.");

  const sql = postgres(databaseUrl, { max: 1 });
  try {
    const filas = await sql<{ cve_empresa: number; nombre_comercial: string; sign_password: string }[]>`
      select cve_empresa, nombre_comercial, sign_password
      from corporativo.empresas
      where sign_password is not null and sign_password_enc is null
    `;

    if (filas.length === 0) {
      console.log("Nada que migrar: no hay sign_password en claro pendiente.");
      return;
    }

    console.log(`Cifrando sign_password de ${filas.length} empresa(s)...`);
    for (const fila of filas) {
      const cifrado = encryptSecret(fila.sign_password, key);
      await sql`
        update corporativo.empresas
        set sign_password_enc = ${cifrado}, sign_password = null
        where cve_empresa = ${fila.cve_empresa}
      `;
      console.log(`  OK  cve_empresa=${fila.cve_empresa} (${fila.nombre_comercial})`);
    }

    const [{ pendientes }] = await sql<{ pendientes: string }[]>`
      select count(*)::text as pendientes from corporativo.empresas where sign_password is not null
    `;
    console.log(`Listo. Filas con sign_password en claro restantes: ${pendientes}`);
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
