import type { Empresa } from "@/features/empresas";
import type { Cliente } from "@/features/tenant";

/** Usuario autenticado, sin datos sensibles (nunca incluye el hash). */
export type SessionUser = {
  id: number;
  login: string;
  nombre: string;
  email: string | null;
  avatar: string | null;
  /** Perfil(es) del usuario, unidos para mostrar (p. ej. "Administrador"). */
  perfil: string | null;
};

/**
 * Contexto de sesión que consumen layouts, guards y la UI: quién es el usuario,
 * qué puede hacer y en qué empresa está trabajando.
 */
export type SessionContext = {
  /** Cliente (tenant) al que pertenece la sesión, resuelto por subdominio. */
  cliente: Cliente;
  usuario: SessionUser;
  permisos: string[];
  /** Claves de módulos de aplicación a los que el operador tiene acceso. */
  modulos: string[];
  empresaActiva: Empresa | null;
  empresas: Empresa[];
};
