/**
 * Sucursal = una fila de `corporativo.empresas` con `idEmpresaMatriz` distinto
 * de null. La matriz de un cliente es la fila con `idEmpresaMatriz === null`.
 * RFC y razón social se heredan de la matriz al crear (no son editables).
 */
export type SucursalListItem = {
  id: number;
  nombreComercial: string;
  nombreCorto: string | null;
  esMatriz: boolean;
  calle: string | null;
  colonia: string | null;
  ciudad: string | null;
  codigoPostal: number | null;
  telefono: string | null;
  email: string | null;
  activo: boolean;
};

export type SucursalDetalle = SucursalListItem & {
  rfc: string | null;
  razonSocial: string | null;
};

export type SucursalFormData = {
  nombreComercial: string;
  nombreCorto: string | null;
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
