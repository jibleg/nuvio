-- 0003_multitenant.sql
-- Multitenancy externo (SaaS): un nivel raíz "cliente" (tenant) por encima de
-- las empresas. Modelo: schema compartido + discriminador cve_cliente.
-- Aislamiento entre clientes por columna; resolución de tenant por subdominio.
-- Permisos y módulos permanecen como catálogo GLOBAL (ligados al código).

BEGIN;

-- 1) Tabla raíz de clientes (tenant) ----------------------------------------
CREATE SEQUENCE IF NOT EXISTS corporativo.sq_corp_clientes;

CREATE TABLE IF NOT EXISTS corporativo.clientes (
  cve_cliente integer PRIMARY KEY DEFAULT nextval('corporativo.sq_corp_clientes'),
  slug        varchar(63)  NOT NULL,
  nombre      varchar(150) NOT NULL,
  activo      smallint     NOT NULL DEFAULT 1,
  fecha_alta  timestamptz  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_clientes_slug
  ON corporativo.clientes (lower(slug));

-- Cliente 1 = todos los datos existentes (el grupo actual).
INSERT INTO corporativo.clientes (cve_cliente, slug, nombre)
  VALUES (1, 'grupo', 'Grupo (datos actuales)')
  ON CONFLICT (cve_cliente) DO NOTHING;
-- La secuencia debe quedar por encima del id sembrado manualmente.
SELECT setval(
  'corporativo.sq_corp_clientes',
  GREATEST((SELECT COALESCE(max(cve_cliente), 1) FROM corporativo.clientes), 1)
);

-- 2) Columna discriminadora cve_cliente en las tablas del núcleo ------------
ALTER TABLE corporativo.empresas    ADD COLUMN IF NOT EXISTS cve_cliente integer;
ALTER TABLE administracion.usuarios ADD COLUMN IF NOT EXISTS cve_cliente integer;
ALTER TABLE administracion.perfiles ADD COLUMN IF NOT EXISTS cve_cliente integer;
ALTER TABLE administracion.sesiones ADD COLUMN IF NOT EXISTS cve_cliente integer;

-- 3) Backfill: todo lo existente pertenece al Cliente 1 ---------------------
UPDATE corporativo.empresas    SET cve_cliente = 1 WHERE cve_cliente IS NULL;
UPDATE administracion.usuarios SET cve_cliente = 1 WHERE cve_cliente IS NULL;
UPDATE administracion.perfiles SET cve_cliente = 1 WHERE cve_cliente IS NULL;
UPDATE administracion.sesiones SET cve_cliente = 1 WHERE cve_cliente IS NULL;

-- Forzar re-login limpio con contexto de tenant (las cookies viejas mueren).
UPDATE administracion.sesiones SET revocada = 1 WHERE revocada = 0;

-- 4) NOT NULL + llaves foráneas --------------------------------------------
ALTER TABLE corporativo.empresas    ALTER COLUMN cve_cliente SET NOT NULL;
ALTER TABLE administracion.usuarios ALTER COLUMN cve_cliente SET NOT NULL;
ALTER TABLE administracion.perfiles ALTER COLUMN cve_cliente SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_empresas_cliente') THEN
    ALTER TABLE corporativo.empresas
      ADD CONSTRAINT fk_empresas_cliente
      FOREIGN KEY (cve_cliente) REFERENCES corporativo.clientes(cve_cliente);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_usuarios_cliente') THEN
    ALTER TABLE administracion.usuarios
      ADD CONSTRAINT fk_usuarios_cliente
      FOREIGN KEY (cve_cliente) REFERENCES corporativo.clientes(cve_cliente);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_perfiles_cliente') THEN
    ALTER TABLE administracion.perfiles
      ADD CONSTRAINT fk_perfiles_cliente
      FOREIGN KEY (cve_cliente) REFERENCES corporativo.clientes(cve_cliente);
  END IF;
END $$;

-- 5) Unicidad AHORA por cliente (login/email únicos dentro del tenant) ------
DROP INDEX IF EXISTS administracion.ux_usuarios_email;
DROP INDEX IF EXISTS administracion.ux_usuarios_login;
CREATE UNIQUE INDEX ux_usuarios_cliente_email
  ON administracion.usuarios (cve_cliente, lower(email))
  WHERE email IS NOT NULL AND email <> '';
CREATE UNIQUE INDEX ux_usuarios_cliente_login
  ON administracion.usuarios (cve_cliente, login);

CREATE INDEX IF NOT EXISTS ix_empresas_cliente ON corporativo.empresas (cve_cliente);
CREATE INDEX IF NOT EXISTS ix_perfiles_cliente ON administracion.perfiles (cve_cliente);
CREATE INDEX IF NOT EXISTS ix_sesiones_cliente ON administracion.sesiones (cve_cliente);

-- 6) Cliente 2 de prueba (aislado) = "acme" ---------------------------------
INSERT INTO corporativo.clientes (slug, nombre)
  SELECT 'acme', 'ACME Demo'
  WHERE NOT EXISTS (SELECT 1 FROM corporativo.clientes WHERE lower(slug) = 'acme');

-- Empresa del cliente acme.
INSERT INTO corporativo.empresas
  (cve_empresa, nombre_comercial, descripcion, nombre_corto, razon_social, rfc, activo, cve_cliente)
SELECT
  (SELECT max(cve_empresa) + 1 FROM corporativo.empresas),
  'ACME Matriz', 'Empresa matriz de ACME', 'ACME', 'ACME SA DE CV', 'ACM010101AAA', 1,
  (SELECT cve_cliente FROM corporativo.clientes WHERE slug = 'acme')
WHERE NOT EXISTS (
  SELECT 1 FROM corporativo.empresas
  WHERE cve_cliente = (SELECT cve_cliente FROM corporativo.clientes WHERE slug = 'acme')
);

-- Perfil "Administrador" propio del cliente acme.
INSERT INTO administracion.perfiles (cve_perfil, nombre, descripcion, activo, cve_cliente)
SELECT
  (SELECT max(cve_perfil) + 1 FROM administracion.perfiles),
  'Administrador', 'Rol administrador de ACME', 1,
  (SELECT cve_cliente FROM corporativo.clientes WHERE slug = 'acme')
WHERE NOT EXISTS (
  SELECT 1 FROM administracion.perfiles
  WHERE cve_cliente = (SELECT cve_cliente FROM corporativo.clientes WHERE slug = 'acme')
);

-- Usuario admin del cliente acme (reutiliza el hash bcrypt de 'demo' => Demo1234!).
INSERT INTO administracion.usuarios
  (cve_usuario, login, password, nombre, descripcion, email, activo_usuario, cve_cliente)
SELECT
  (SELECT max(cve_usuario) + 1 FROM administracion.usuarios),
  'admin',
  (SELECT password FROM administracion.usuarios WHERE cve_usuario = 100),
  'Administrador ACME', 'Usuario administrador de ACME', 'admin@acme.local', 1,
  (SELECT cve_cliente FROM corporativo.clientes WHERE slug = 'acme')
WHERE NOT EXISTS (
  SELECT 1 FROM administracion.usuarios
  WHERE cve_cliente = (SELECT cve_cliente FROM corporativo.clientes WHERE slug = 'acme')
);

-- Vínculo perfil<->usuario (admin de acme).
INSERT INTO administracion.perfil_usuarios (cve_perfil_usuario, cve_usuario, cve_perfil)
SELECT
  (SELECT COALESCE(max(cve_perfil_usuario), 0) + 1 FROM administracion.perfil_usuarios),
  u.cve_usuario,
  p.cve_perfil
FROM administracion.usuarios u
JOIN administracion.perfiles p
  ON p.cve_cliente = u.cve_cliente AND p.nombre = 'Administrador'
WHERE u.cve_cliente = (SELECT cve_cliente FROM corporativo.clientes WHERE slug = 'acme')
  AND u.login = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM administracion.perfil_usuarios pu WHERE pu.cve_usuario = u.cve_usuario
  );

-- Permisos del perfil admin de acme = mismos que el Administrador del Cliente 1.
INSERT INTO administracion.perfil_permisos (cve_perfil_permiso, cve_perfil, cve_permiso)
SELECT
  (SELECT COALESCE(max(cve_perfil_permiso), 0) FROM administracion.perfil_permisos)
    + row_number() OVER (),
  (SELECT p.cve_perfil FROM administracion.perfiles p
     WHERE p.cve_cliente = (SELECT cve_cliente FROM corporativo.clientes WHERE slug = 'acme')
       AND p.nombre = 'Administrador'),
  src.cve_permiso
FROM administracion.perfil_permisos src
WHERE src.cve_perfil = 1
  AND NOT EXISTS (
    SELECT 1 FROM administracion.perfil_permisos existing
    WHERE existing.cve_perfil = (SELECT p.cve_perfil FROM administracion.perfiles p
       WHERE p.cve_cliente = (SELECT cve_cliente FROM corporativo.clientes WHERE slug = 'acme')
         AND p.nombre = 'Administrador')
  );

-- Empresa accesible por el admin de acme.
INSERT INTO administracion.usuario_empresas (cve_usuario, cve_empresa)
SELECT u.cve_usuario, e.cve_empresa
FROM administracion.usuarios u
JOIN corporativo.empresas e ON e.cve_cliente = u.cve_cliente
WHERE u.cve_cliente = (SELECT cve_cliente FROM corporativo.clientes WHERE slug = 'acme')
  AND u.login = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM administracion.usuario_empresas ue WHERE ue.cve_usuario = u.cve_usuario
  );

-- Módulo Administración para el admin de acme.
INSERT INTO administracion.usuario_modulos (cve_usuario, modulo_key)
SELECT u.cve_usuario, 'administracion'
FROM administracion.usuarios u
WHERE u.cve_cliente = (SELECT cve_cliente FROM corporativo.clientes WHERE slug = 'acme')
  AND u.login = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM administracion.usuario_modulos um
    WHERE um.cve_usuario = u.cve_usuario AND um.modulo_key = 'administracion'
  );

-- 7) Propiedad para el rol de la app -----------------------------------------
ALTER TABLE corporativo.clientes           OWNER TO nuvio;
ALTER SEQUENCE corporativo.sq_corp_clientes OWNER TO nuvio;

COMMIT;
