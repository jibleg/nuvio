/**
 * Catálogo de planes comerciales de Nuvio. Un cliente (tenant) contrata uno de
 * estos planes; limita cuántas empresas puede crear y cuántos módulos de
 * negocio puede licenciar (además de "administracion", que siempre va
 * incluido y no cuenta contra el límite). Nuvio no limita la operación dentro
 * de un módulo (cajas, cortes, movimientos, timbres, usuarios...): solo el
 * tamaño del ecosistema (empresas) y la cobertura de módulos contratados.
 */
export type PlanKey = "emprendedor" | "contigo_plus" | "empresarial";

export type Plan = {
  key: PlanKey;
  nombre: string;
  descripcion: string;
  /** null = sin límite. */
  maxEmpresas: number | null;
  /** Módulos de negocio (sin contar "administracion"). null = todos, incluidos los que se lancen a futuro. */
  maxModulosNegocio: number | null;
};

export const PLANES: Plan[] = [
  {
    key: "emprendedor",
    nombre: "Emprendedor",
    descripcion: "Hasta 2 empresas y 2 módulos de negocio.",
    maxEmpresas: 2,
    maxModulosNegocio: 2,
  },
  {
    key: "contigo_plus",
    nombre: "Contigo+",
    descripcion: "Hasta 5 empresas y 3 módulos de negocio.",
    maxEmpresas: 5,
    maxModulosNegocio: 3,
  },
  {
    key: "empresarial",
    nombre: "Sin límites",
    descripcion: "Empresas y módulos sin límite (incluye los que se lancen a futuro).",
    maxEmpresas: null,
    maxModulosNegocio: null,
  },
];

const PORKEY = new Map(PLANES.map((plan) => [plan.key, plan]));

export function getPlan(key: string): Plan | undefined {
  return PORKEY.get(key as PlanKey);
}
