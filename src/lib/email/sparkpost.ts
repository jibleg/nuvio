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

/**
 * Remitente de correo propio de un tenant: `{slug}.nuvio@{dominio de EMAIL_FROM}`
 * (p. ej. `israel.nuvio@correo.proyectosolmeca.com` para el tenant "israel").
 * Decisión del usuario: cada cliente envía desde su propia dirección — mismo
 * dominio ya verificado en SparkPost, solo cambia el local-part — en vez de
 * un remitente genérico compartido por todos los tenants.
 *
 * El dominio se deriva de `EMAIL_FROM` (no se repite como literal) para que
 * cambiarlo en `.env` no requiera tocar código; `null` si no hay `EMAIL_FROM`
 * configurado (mismo caso en el que `enviarCorreo` ya falla igual).
 */
export function remitenteTenant(slug: string, nombreMostrar?: string): { email: string; nombre?: string } | null {
  const dominio = env.EMAIL_FROM?.split("@")[1];
  if (!dominio) return null;
  return { email: `${slug}.nuvio@${dominio}`, nombre: nombreMostrar };
}

export async function enviarCorreo(args: {
  /** Remitente específico (p. ej. el de un tenant, ver `remitenteTenant`). Sin esto, cae a `EMAIL_FROM`/`EMAIL_FROM_NAME`. */
  remitente?: { email: string; nombre?: string };
  /** Uno o varios destinatarios — SparkPost les manda una copia individual a cada quien, no se ven entre sí (nunca van en un mismo "Para"). */
  para: { email: string; nombre?: string } | { email: string; nombre?: string }[];
  asunto: string;
  html: string;
  adjuntos?: EmailAdjunto[];
}): Promise<EnviarCorreoResult> {
  if (!env.SPARKPOST_API_KEY) {
    return { ok: false, error: "El envío de correo no está configurado (falta SPARKPOST_API_KEY)." };
  }
  const remitenteEmail = args.remitente?.email ?? env.EMAIL_FROM;
  if (!remitenteEmail) {
    return { ok: false, error: "El envío de correo no está configurado (falta EMAIL_FROM)." };
  }
  const remitenteNombre = args.remitente?.nombre ?? env.EMAIL_FROM_NAME;
  const destinatarios = Array.isArray(args.para) ? args.para : [args.para];

  const body = {
    content: {
      from: { email: remitenteEmail, name: remitenteNombre },
      subject: args.asunto,
      html: args.html,
      attachments: args.adjuntos?.map((a) => ({ type: a.tipoMime, name: a.nombre, data: a.contenidoBase64 })),
    },
    recipients: destinatarios.map((d) => ({ address: { email: d.email, name: d.nombre } })),
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
