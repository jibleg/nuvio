/**
 * Empresas: proveedor de datos de multiempresa (solo lectura).
 * La empresa activa se guarda en la sesión y se cambia desde el feature `auth`.
 */
export type { Empresa } from "./types";
export {
  findEmpresasByUsuario,
  findAllEmpresas,
  usuarioTieneAccesoAEmpresa,
} from "./repositories/empresas-repository";
