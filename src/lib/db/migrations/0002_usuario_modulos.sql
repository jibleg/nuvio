-- Asociación operador ↔ módulo de aplicación (POS, Inventario, Facturación,
-- Administración…). El acceso a un módulo es explícito, independiente del RBAC
-- de permisos (que gobierna las funciones dentro de cada módulo). Idempotente.

CREATE SEQUENCE IF NOT EXISTS administracion.sq_admin_usuario_modulos;

CREATE TABLE IF NOT EXISTS administracion.usuario_modulos (
  cve_usuario_modulo integer PRIMARY KEY DEFAULT nextval('administracion.sq_admin_usuario_modulos'),
  cve_usuario        integer NOT NULL REFERENCES administracion.usuarios (cve_usuario),
  modulo_key         varchar(50) NOT NULL,
  fecha_alta         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cve_usuario, modulo_key)
);

CREATE INDEX IF NOT EXISTS ix_usuario_modulos_usuario
  ON administracion.usuario_modulos (cve_usuario);
