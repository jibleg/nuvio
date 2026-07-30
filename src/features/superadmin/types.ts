import type { PlanKey } from "@/config/plans";

/** Staff de Nuvio autenticado en el panel interno (nunca un usuario de un cliente). */
export type SuperAdminUser = {
  id: number;
  nombre: string;
  email: string;
};

export type SuperAdminSessionContext = {
  superAdmin: SuperAdminUser;
};

/** Fila de la tabla de clientes (tenants) del panel interno. */
export type ClienteListItem = {
  id: number;
  slug: string;
  nombre: string;
  activo: boolean;
  fechaAlta: Date;
  plan: PlanKey;
  empresasCount: number;
  usuariosCount: number;
  moduloKeys: string[];
};

export type ClienteDetalle = {
  id: number;
  slug: string;
  nombre: string;
  activo: boolean;
  plan: PlanKey;
  empresasCount: number;
  /** Módulos licenciados (paquete/plan). "administracion" siempre incluido. */
  moduloKeys: string[];
  /** Usuario administrador sembrado en el onboarding (login "admin"), si existe. */
  adminUsuario: { id: number; nombre: string; email: string | null } | null;
};

/** Datos del wizard de alta: cliente + su primera empresa + su primer administrador. */
export type OnboardClienteData = {
  clienteNombre: string;
  slug: string;
  plan: PlanKey;
  empresaNombreComercial: string;
  empresaNombreCorto: string | null;
  empresaRazonSocial: string | null;
  empresaRfc: string | null;
  adminNombre: string;
  adminEmail: string;
  adminPassword: string;
  /** Módulos de negocio licenciados; "administracion" se agrega siempre. */
  modulos: string[];
};

export type UpdateClienteData = {
  nombre: string;
  activo: boolean;
  plan: PlanKey;
  modulos: string[];
};

export type SuperAdminMutationResult =
  | { ok: true; id?: number }
  | { ok: false; error: string };

/** Estadísticas para la vista de resumen del panel interno. */
export type SuperAdminStats = {
  clientesTotal: number;
  clientesActivos: number;
  empresasTotal: number;
  usuariosTotal: number;
};
