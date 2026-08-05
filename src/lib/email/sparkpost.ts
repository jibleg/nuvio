import "server-only";
import { env } from "@/lib/env";

/**
 * Cliente delgado sobre la API de Transmissions de SparkPost — correo
 * saliente transversal a todos los módulos de Nuvio, no solo Facturación.
 */

export type EmailAdjunto = {
  nombre: string;
  tipoMime: string;
  /** Contenido en base64. */
  contenidoBase64: string;
};

export type EnviarCorreoResult = { ok: true } | { ok: false; error: string };

type SparkPostErrorResponse = { errors?: { message?: string; description?: string }[] };

export async function enviarCorreo(args: {
  para: { email: string; nombre?: string };
  asunto: string;
  html: string;
  adjuntos?: EmailAdjunto[];
}): Promise<EnviarCorreoResult> {
  if (!env.SPARKPOST_API_KEY) {
    return { ok: false, error: "El envío de correo no está configurado (falta SPARKPOST_API_KEY)." };
  }
  if (!env.EMAIL_FROM) {
    return { ok: false, error: "El envío de correo no está configurado (falta EMAIL_FROM)." };
  }

  const body = {
    content: {
      from: { email: env.EMAIL_FROM, name: env.EMAIL_FROM_NAME },
      subject: args.asunto,
      html: args.html,
      attachments: args.adjuntos?.map((a) => ({ type: a.tipoMime, name: a.nombre, data: a.contenidoBase64 })),
    },
    recipients: [{ address: { email: args.para.email, name: args.para.nombre } }],
  };

  try {
    const res = await fetch(`${env.SPARKPOST_API_BASE}/transmissions`, {
      method: "POST",
      headers: { Authorization: env.SPARKPOST_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as SparkPostErrorResponse | null;
      const mensaje = data?.errors?.[0]?.message ?? `SparkPost respondió HTTP ${res.status}.`;
      return { ok: false, error: mensaje };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo conectar con el servicio de correo. Revisa la conexión." };
  }
}
