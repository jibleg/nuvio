/**
 * Registro de módulos de aplicación de Nuvio (el "portal" que ve el operador).
 * El acceso por usuario se guarda en `administracion.usuario_modulos`; aquí solo
 * viven las definiciones estáticas. El icono es una clave que la UI resuelve.
 */
export type ModuloKey =
  | "administracion"
  | "facturacion"
  | "pos"
  | "inventario";

export type AppModulo = {
  key: ModuloKey;
  nombre: string;
  descripcion: string;
  /** Clave de icono (resuelta en la UI a un icono de lucide). */
  icon: string;
  /** Ruta de inicio del módulo (su dashboard). */
  homeHref: string;
  /** false = aún no construido ("próximamente"). */
  disponible: boolean;
};

export const APP_MODULOS: AppModulo[] = [
  {
    key: "administracion",
    nombre: "Administración",
    descripcion: "Usuarios, perfiles, permisos y accesos a módulos.",
    icon: "shield",
    homeHref: "/administracion",
    disponible: true,
  },
  {
    key: "facturacion",
    nombre: "Facturación",
    descripcion: "CFDI 4.0: emite, timbra y consulta tus facturas.",
    icon: "file-text",
    homeHref: "/facturacion",
    disponible: false,
  },
  {
    key: "pos",
    nombre: "Punto de venta",
    descripcion: "Vende rápido y cobra en caja sin fricción.",
    icon: "shopping-cart",
    homeHref: "/pos",
    disponible: false,
  },
  {
    key: "inventario",
    nombre: "Inventario",
    descripcion: "Productos, existencias y movimientos al día.",
    icon: "package",
    homeHref: "/inventario",
    disponible: false,
  },
];

const PORKEY = new Map(APP_MODULOS.map((modulo) => [modulo.key, modulo]));

export function getModulo(key: string): AppModulo | undefined {
  return PORKEY.get(key as ModuloKey);
}

/** Resuelve claves de módulo a sus definiciones, en el orden del registro. */
export function resolveModulos(keys: string[]): AppModulo[] {
  const set = new Set(keys);
  return APP_MODULOS.filter((modulo) => set.has(modulo.key));
}
