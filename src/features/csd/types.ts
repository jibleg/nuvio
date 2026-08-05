/**
 * CSD (Certificado de Sello Digital) por empresa — necesario para timbrar
 * CFDI a su nombre. Vive en `corporativo.empresas` (columnas `sign_*`), no en
 * una tabla propia: es 1-a-1 con la empresa, igual que sus datos fiscales.
 */
export type CsdDetalle = {
  tieneCsd: boolean;
  numeroCertificado: string | null;
  validoDesde: string | null;
  validoHasta: string | null;
};

export type CsdMutationResult = { ok: true } | { ok: false; error: string };
