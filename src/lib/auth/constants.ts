/**
 * Constantes de sesión. Módulo puro (sin dependencias de Node/DB) para poder
 * importarse también desde el middleware en el runtime edge.
 */
export const SESSION_COOKIE_NAME = "nuvio_session";

/** Duración de una sesión: 8 horas (jornada laboral). */
export const SESSION_DURATION_SECONDS = 60 * 60 * 8;

/**
 * Cookie del panel interno (super-admin). Nombre distinto a propósito: nunca
 * debe confundirse ni colisionar con la cookie de sesión de un tenant.
 */
export const SUPERADMIN_SESSION_COOKIE_NAME = "nuvio_superadmin_session";
export const SUPERADMIN_SESSION_DURATION_SECONDS = 60 * 60 * 8;
