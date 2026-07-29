import { sql } from "drizzle-orm";
import {
  integer,
  pgSchema,
  smallint,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Mapeo Drizzle del schema `administracion` (RBAC heredado de factura-facil).
 * Las columnas legacy (`cve_*`) se exponen con nombres de dominio limpios; el
 * nombre físico de la columna va como primer argumento de cada helper.
 */
export const administracion = pgSchema("administracion");

export const usuarios = administracion.table("usuarios", {
  id: integer("cve_usuario").primaryKey(),
  idCliente: integer("cve_cliente").notNull(),
  login: varchar("login").notNull(),
  passwordHash: varchar("password").notNull(),
  nombre: varchar("nombre").notNull(),
  descripcion: varchar("descripcion").notNull(),
  email: varchar("email"),
  activo: integer("activo_usuario"),
  debeCambiarPassword: smallint("debe_cambiar_contrasena").notNull().default(0),
  avatar: text("avatar"),
});

export const perfiles = administracion.table("perfiles", {
  id: integer("cve_perfil").primaryKey(),
  idCliente: integer("cve_cliente").notNull(),
  nombre: varchar("nombre").notNull(),
  descripcion: varchar("descripcion"),
  activo: smallint("activo").notNull().default(1),
});

export const modulos = administracion.table("modulos", {
  id: integer("cve_modulo").primaryKey(),
  nombre: varchar("nombre").notNull(),
  descripcion: varchar("descripcion"),
  idModuloRaiz: integer("cve_modulo_raiz").notNull().default(-1),
});

export const permisos = administracion.table("permisos", {
  id: integer("cve_permiso").primaryKey(),
  idModulo: integer("cve_modulo"),
  nombre: varchar("nombre").notNull(),
  codigo: varchar("codigo"),
  activo: smallint("activo").notNull().default(1),
});

export const perfilPermisos = administracion.table("perfil_permisos", {
  id: integer("cve_perfil_permiso").primaryKey(),
  idPerfil: integer("cve_perfil"),
  idPermiso: integer("cve_permiso"),
});

export const perfilUsuarios = administracion.table("perfil_usuarios", {
  id: integer("cve_perfil_usuario").primaryKey(),
  idUsuario: integer("cve_usuario"),
  idPerfil: integer("cve_perfil"),
});

/** Sesiones server-side (respaldo de la cookie httpOnly). */
export const sesiones = administracion.table("sesiones", {
  id: integer("cve_sesion")
    .primaryKey()
    .default(sql`nextval('administracion.sq_admin_sesiones')`),
  tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
  idUsuario: integer("cve_usuario").notNull(),
  idCliente: integer("cve_cliente"),
  idEmpresaActiva: integer("cve_empresa_activa"),
  fechaCreacion: timestamp("fecha_creacion", { withTimezone: true })
    .notNull()
    .defaultNow(),
  fechaExpira: timestamp("fecha_expira", { withTimezone: true }).notNull(),
  fechaUltimoUso: timestamp("fecha_ultimo_uso", { withTimezone: true }),
  ip: varchar("ip", { length: 64 }),
  userAgent: varchar("user_agent", { length: 512 }),
  revocada: smallint("revocada").notNull().default(0),
});

/** Asociación operador ↔ módulo de aplicación (POS, Inventario, Facturación…). */
export const usuarioModulos = administracion.table("usuario_modulos", {
  id: integer("cve_usuario_modulo")
    .primaryKey()
    .default(sql`nextval('administracion.sq_admin_usuario_modulos')`),
  idUsuario: integer("cve_usuario").notNull(),
  moduloKey: varchar("modulo_key", { length: 50 }).notNull(),
  fechaAlta: timestamp("fecha_alta", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Empresas accesibles por usuario (base del multiempresa). */
export const usuarioEmpresas = administracion.table("usuario_empresas", {
  id: integer("cve_usuario_empresa")
    .primaryKey()
    .default(sql`nextval('administracion.sq_admin_usuario_empresas')`),
  idUsuario: integer("cve_usuario").notNull(),
  idEmpresa: integer("cve_empresa").notNull(),
  fechaAlta: timestamp("fecha_alta", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
