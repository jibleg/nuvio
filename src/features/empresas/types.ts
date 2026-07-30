/** Empresa tal como la consume el sistema (multiempresa). */
export type Empresa = {
  id: number;
  nombreComercial: string;
  nombreCorto: string | null;
  rfc: string | null;
  activo: number | null;
  /** NULL = esta empresa es la matriz; con valor = es sucursal de esa matriz. */
  idEmpresaMatriz: number | null;
};
