/**
 * Centralized route paths. Reference these constants instead of hardcoding
 * URL strings across the app so that a path change happens in one place.
 */
export const ROUTES = {
  home: "/",
  login: "/login",
  /** Portal de módulos (launcher tras iniciar sesión). */
  dashboard: "/dashboard",
  noAutorizado: "/no-autorizado",
  perfil: "/perfil",

  // Módulo Administración
  administracion: "/administracion",
  usuarios: "/administracion/usuarios",
  perfiles: "/administracion/perfiles",
  sucursales: "/administracion/sucursales",
  clientesProveedores: "/administracion/clientes-proveedores",

  // Otros módulos (portal)
  facturacion: "/facturacion",
  pos: "/pos",
  inventario: "/inventario",

  // Panel interno (staff de Nuvio, gestión de clientes/tenants)
  superadminLogin: "/superadmin/login",
  superadmin: "/superadmin",
  superadminClientes: "/superadmin/clientes",
  superadminStaff: "/superadmin/staff",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
