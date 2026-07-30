-- 0004_superadmin.sql
-- Panel interno de Nuvio: staff que gestiona el catálogo de clientes (tenants).
-- Autenticación TOTALMENTE AISLADA de administracion.usuarios/sesiones (que son
-- por-cliente): un super-admin no pertenece a ningún tenant, así que una brecha
-- en un cliente nunca puede escalar a este panel. Vive en el dominio raíz (sin
-- subdominio), fuera del alcance de `getCurrentTenant()`.

BEGIN;

CREATE SEQUENCE IF NOT EXISTS corporativo.sq_corp_super_admins;

CREATE TABLE IF NOT EXISTS corporativo.super_admins (
  cve_super_admin integer PRIMARY KEY DEFAULT nextval('corporativo.sq_corp_super_admins'),
  email           varchar(255) NOT NULL,
  password        varchar(255) NOT NULL,
  nombre          varchar(150) NOT NULL,
  activo          smallint     NOT NULL DEFAULT 1,
  fecha_alta      timestamptz  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_super_admins_email
  ON corporativo.super_admins (lower(email));

CREATE SEQUENCE IF NOT EXISTS corporativo.sq_corp_super_admin_sesiones;

CREATE TABLE IF NOT EXISTS corporativo.super_admin_sesiones (
  cve_sesion       integer PRIMARY KEY DEFAULT nextval('corporativo.sq_corp_super_admin_sesiones'),
  token_hash       varchar(64)  NOT NULL UNIQUE,
  cve_super_admin  integer      NOT NULL REFERENCES corporativo.super_admins(cve_super_admin),
  fecha_creacion   timestamptz  NOT NULL DEFAULT now(),
  fecha_expira     timestamptz  NOT NULL,
  fecha_ultimo_uso timestamptz,
  ip               varchar(64),
  user_agent       varchar(512),
  revocada         smallint     NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS ix_super_admin_sesiones_admin
  ON corporativo.super_admin_sesiones (cve_super_admin);

ALTER TABLE corporativo.super_admins                   OWNER TO nuvio;
ALTER SEQUENCE corporativo.sq_corp_super_admins         OWNER TO nuvio;
ALTER TABLE corporativo.super_admin_sesiones            OWNER TO nuvio;
ALTER SEQUENCE corporativo.sq_corp_super_admin_sesiones OWNER TO nuvio;

-- Super-admin semilla para desarrollo (password: NuvioAdmin2026!).
INSERT INTO corporativo.super_admins (email, password, nombre)
SELECT 'soporte@nuvio.app',
       '$2b$10$ke4zT5vRwft3o8fqSgb.zeD9Y3Z1WM3Va9sL6.a9B3DqQNMbX/bZm',
       'Equipo Nuvio'
WHERE NOT EXISTS (
  SELECT 1 FROM corporativo.super_admins WHERE lower(email) = 'soporte@nuvio.app'
);

COMMIT;
