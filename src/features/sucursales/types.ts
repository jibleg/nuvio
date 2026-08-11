/**
 * Sucursal = una fila de `corporativo.empresas` con `idEmpresaMatriz` distinto
 * de null. La matriz de un cliente es la fila con `idEmpresaMatriz === null`.
 * RFC y razón social viven en la propia fila, pero por defecto quedan en NULL:
 * una sucursal con `rfc`/`razonSocial` NULL hereda (en vivo, no por copia) los
 * de su matriz al momento de facturar. Solo si la sucursal factura con una
 * razón social propia (certificado/CSD distinto) se llenan con datos propios.
 */
/** Ambiente de Finkok para timbrar a nombre de una empresa: pruebas (sin validez fiscal) o SAT real. */
export type AmbienteFacturacion = "sandbox" | "produccion";

export type SucursalListItem = {
  id: number;
  nombreComercial: string;
  nombreCorto: string | null;
  esMatriz: boolean;
  esFiscalPropio: boolean;
  calle: string | null;
  colonia: string | null;
  ciudad: string | null;
  codigoPostal: number | null;
  telefono: string | null;
  email: string | null;
  activo: boolean;
};

export type SucursalDetalle = SucursalListItem & {
  /** Valores propios de esta fila; NULL cuando hereda de la matriz. */
  rfcPropio: string | null;
  razonSocialPropia: string | null;
  idRegimenPropio: number | null;
  /** Con los que esta sucursal facturaría hoy: propios o heredados de la matriz. */
  rfcEfectivo: string | null;
  razonSocialEfectiva: string | null;
  idRegimenEfectivo: number | null;
  ambienteTimbrado: AmbienteFacturacion;
  /** Serie del CFDI (prefijo de folio), propia de esta empresa — no se hereda de la matriz. */
  serie: string | null;
};

export type SucursalFormData = {
  nombreComercial: string;
  nombreCorto: string | null;
  usaFiscalPropio: boolean;
  razonSocialPropia: string | null;
  rfcPropio: string | null;
  idRegimen: number | null;
  serie: string | null;
  calle: string | null;
  colonia: string | null;
  ciudad: string | null;
  codigoPostal: number | null;
  telefono: string | null;
  email: string | null;
};

export type UpdateSucursalData = SucursalFormData & { activo: boolean };

export type SucursalMutationResult =
  | { ok: true; id?: number }
  | { ok: false; error: string };

export type LogoDetalle = { tieneLogo: boolean; nombre: string | null };

export type LogoMutationResult = { ok: true } | { ok: false; error: string };
