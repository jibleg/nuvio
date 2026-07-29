-- Fase 0 — Fundación de Auth + Multiempresa.
-- Migración ADITIVA: crea las dos piezas que faltan en el RBAC heredado de
-- factura-facil. No modifica ninguna tabla existente. Idempotente.

-- Sesiones de autenticación (respaldo server-side de la cookie httpOnly).
-- El token de la cookie se guarda hasheado (sha256); nunca en claro.
CREATE SEQUENCE IF NOT EXISTS administracion.sq_admin_sesiones;

CREATE TABLE IF NOT EXISTS administracion.sesiones (
  cve_sesion        integer PRIMARY KEY DEFAULT nextval('administracion.sq_admin_sesiones'),
  token_hash        varchar(64) NOT NULL UNIQUE,
  cve_usuario       integer NOT NULL REFERENCES administracion.usuarios (cve_usuario),
  cve_empresa_activa integer REFERENCES corporativo.empresas (cve_empresa),
  fecha_creacion    timestamptz NOT NULL DEFAULT now(),
  fecha_expira      timestamptz NOT NULL,
  fecha_ultimo_uso  timestamptz,
  ip                varchar(64),
  user_agent        varchar(512),
  revocada          smallint NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS ix_sesiones_usuario ON administracion.sesiones (cve_usuario);

-- Empresas a las que cada usuario tiene acceso (base del multiempresa).
CREATE SEQUENCE IF NOT EXISTS administracion.sq_admin_usuario_empresas;

CREATE TABLE IF NOT EXISTS administracion.usuario_empresas (
  cve_usuario_empresa integer PRIMARY KEY DEFAULT nextval('administracion.sq_admin_usuario_empresas'),
  cve_usuario         integer NOT NULL REFERENCES administracion.usuarios (cve_usuario),
  cve_empresa         integer NOT NULL REFERENCES corporativo.empresas (cve_empresa),
  fecha_alta          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cve_usuario, cve_empresa)
);

CREATE INDEX IF NOT EXISTS ix_usuario_empresas_usuario ON administracion.usuario_empresas (cve_usuario);
