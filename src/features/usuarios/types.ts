import type { Perfil } from "@/features/rbac";
import type { Empresa } from "@/features/empresas";
import type { AppModulo } from "@/config/modules";

/** Fila de la tabla de usuarios (vista de administración). */
export type UsuarioListItem = {
  id: number;
  login: string;
  nombre: string;
  email: string | null;
  activo: boolean;
  perfiles: string[];
  empresasCount: number;
};

/** Detalle de un usuario para el formulario de edición. */
export type UsuarioDetalle = {
  id: number;
  login: string;
  nombre: string;
  email: string | null;
  activo: boolean;
  perfilIds: number[];
  empresaIds: number[];
  moduloKeys: string[];
};

/** Opciones que alimentan el formulario (roles, empresas y módulos asignables). */
export type UsuarioFormOptions = {
  perfiles: Perfil[];
  empresas: Empresa[];
  modulos: AppModulo[];
};

/** Resultado de una mutación de usuario (alta/edición/activación). */
export type UsuarioMutationResult =
  | { ok: true; id?: number }
  | { ok: false; error: string };
