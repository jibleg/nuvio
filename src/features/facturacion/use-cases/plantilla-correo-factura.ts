import { env } from "@/lib/env";

/**
 * Familia tipográfica del sistema (no `@font-face`: Outlook de escritorio lo
 * ignora, así que cargar una fuente propia no serviría de nada ahí).
 */
const FUENTE = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

/** Colores de marca (mismos hex que `globals.css`/el PDF — el correo no puede leer variables CSS). */
const BRAND_700 = "#15808d";
const AURORA_500 = "#58ced5";
const INK = "#0b2e33";
const MUTED = "#5f7c80";
const LINE = "#dcecee";
const BRAND_50 = "#ecffff";
const PAPER = "#f5fbfb";

/** `APP_URL` sin protocolo, para mostrarlo como texto (el link sí lleva el protocolo completo). */
function dominioVisible(): string {
  try {
    return new URL(env.APP_URL).host;
  } catch {
    return env.APP_URL;
  }
}

/**
 * HTML del correo de envío de factura: header con el logo de Nuvio, los
 * datos del CFDI, y un banner promocional de la plataforma — decisión del
 * usuario (2026-08-10) de aprovechar cada envío como canal de adquisición,
 * igual que el pie de página del PDF (`FacturaPdf.tsx`).
 *
 * Tabla + estilos inline a propósito: es la única forma de que se vea
 * consistente en Outlook de escritorio, que ignora `<style>`/CSS moderno.
 */
export function plantillaCorreoFactura({
  receptorNombre,
  emisorNombre,
  folioFiscal,
  urlValidacion,
}: {
  receptorNombre: string | null;
  emisorNombre: string | null;
  folioFiscal: string | null;
  /** Mismo link codificado en el QR del PDF (`urlQrSat`) — `null` si falta algún dato del timbre para armarlo. */
  urlValidacion: string | null;
}): string {
  const logoUrl = `${env.APP_URL}/brand/nuvio-horizontal.png`;
  const olmecaLogoUrl = `${env.APP_URL}/brand/olmeca-icon.png`;
  const saludo = receptorNombre ? `Hola ${receptorNombre},` : "Hola,";
  const nombreEmisor = emisorNombre ?? "Tu proveedor";

  return `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:${PAPER};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid ${LINE};">
            <tr>
              <td style="background:${BRAND_700};padding:36px 32px 40px;text-align:center;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                  <tr>
                    <td style="background:#ffffff;border-radius:18px;padding:16px 26px;box-shadow:0 10px 24px rgba(11,46,51,0.28);">
                      <a href="${env.APP_URL}" style="display:block;line-height:0;text-decoration:none;">
                        <img
                          src="${logoUrl}"
                          width="130"
                          height="44"
                          alt="Nuvio"
                          border="0"
                          style="display:block;border:0;outline:none;max-width:130px;height:auto;font-family:${FUENTE};font-size:16px;font-weight:800;color:${BRAND_700};"
                        />
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="height:4px;line-height:4px;font-size:0;background:${AURORA_500};">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:36px 32px 8px;font-family:${FUENTE};">
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${INK};">${saludo}</p>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:${INK};">
                  <strong>${nombreEmisor}</strong> te envía su factura electrónica. Adjuntamos el PDF y el XML timbrados de este CFDI.
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_50};border-radius:12px;margin-bottom:${urlValidacion ? "12px" : "8px"};">
                  <tr>
                    <td style="padding:18px 20px;">
                      <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:${BRAND_700};font-family:${FUENTE};">Folio fiscal (UUID)</p>
                      <p style="margin:4px 0 0;font-size:13px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:${INK};word-break:break-all;">${folioFiscal ?? "—"}</p>
                    </td>
                  </tr>
                </table>
                ${
                  urlValidacion
                    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid ${LINE};border-radius:12px;margin-bottom:8px;">
                  <tr>
                    <td style="padding:18px 20px;text-align:center;">
                      <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:${BRAND_700};font-family:${FUENTE};">Verifica la autenticidad de tu factura</p>
                      <p style="margin:6px 0 0;font-size:13px;line-height:1.5;color:${INK};font-family:${FUENTE};">Consulta este CFDI directamente en el validador del SAT, con el mismo enlace que codifica el QR del PDF.</p>
                      <a href="${urlValidacion}" style="display:inline-block;margin-top:12px;background:${BRAND_700};color:#ffffff;font-weight:700;font-size:13px;padding:12px 26px;border-radius:999px;text-decoration:none;font-family:${FUENTE};">Verificar en el SAT →</a>
                    </td>
                  </tr>
                </table>`
                    : ""
                }
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_700};border-radius:16px;">
                  <tr>
                    <td style="padding:26px 28px;text-align:center;font-family:${FUENTE};">
                      <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#ffffff;">¿Administras un negocio como ${nombreEmisor}?</p>
                      <p style="margin:0 0 18px;font-size:13px;line-height:1.5;color:#e3f7f8;">
                        Punto de venta, inventario, facturación CFDI 4.0 y contabilidad en una sola plataforma — rápida de implementar y fácil de usar, para dedicar menos tiempo a la administración y más a crecer.
                      </p>
                      <a href="${env.APP_URL}" style="display:inline-block;background:#ffffff;color:${BRAND_700};font-weight:700;font-size:13px;padding:12px 26px;border-radius:999px;text-decoration:none;">Conoce Nuvio →</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 28px;border-top:1px solid ${LINE};text-align:center;font-family:${FUENTE};">
                <p style="margin:0;font-size:12px;line-height:1.5;color:${MUTED};">Este es un correo automático — por favor no respondas a esta dirección.</p>
                <p style="margin:6px 0 0;font-size:12px;color:${MUTED};">Enviado con <strong style="color:${BRAND_700};">Nuvio</strong> · ${dominioVisible()}</p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px auto 0;">
                  <tr>
                    <td style="vertical-align:middle;padding-right:12px;">
                      <a href="https://proyectosolmeca.com/" style="display:block;line-height:0;">
                        <img src="${olmecaLogoUrl}" width="56" height="56" alt="Proyectos Olmeca" border="0" style="display:block;border-radius:10px;" />
                      </a>
                    </td>
                    <td style="vertical-align:middle;">
                      <a href="https://proyectosolmeca.com/" style="font-size:12px;color:${MUTED};text-decoration:none;font-family:${FUENTE};">Nuvio es un producto de <strong style="color:${BRAND_700};">Proyectos Olmeca</strong></a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
