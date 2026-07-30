-- 0005_cliente_modulos.sql
-- Módulos LICENCIADOS por cliente (paquete/plan contratado). Distinto de
-- `administracion.usuario_modulos` (a cuáles de esos módulos tiene acceso un
-- operador concreto): un cliente licencia módulos, y sus operadores reciben
-- un subconjunto de lo licenciado. "administracion" es siempre parte del
-- paquete base (no es un módulo de negocio que se venda aparte).

BEGIN;

CREATE SEQUENCE IF NOT EXISTS corporativo.sq_corp_cliente_modulos;

CREATE TABLE IF NOT EXISTS corporativo.cliente_modulos (
  cve_cliente_modulo integer PRIMARY KEY DEFAULT nextval('corporativo.sq_corp_cliente_modulos'),
  cve_cliente         integer     NOT NULL REFERENCES corporativo.clientes(cve_cliente),
  modulo_key          varchar(50) NOT NULL,
  fecha_alta          timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_cliente_modulos
  ON corporativo.cliente_modulos (cve_cliente, modulo_key);

-- Backfill: cada cliente licencia lo que hoy ya usan sus operadores...
INSERT INTO corporativo.cliente_modulos (cve_cliente, modulo_key)
SELECT DISTINCT u.cve_cliente, um.modulo_key
FROM administracion.usuario_modulos um
JOIN administracion.usuarios u ON u.cve_usuario = um.cve_usuario
ON CONFLICT (cve_cliente, modulo_key) DO NOTHING;

-- ...y "administracion" queda garantizado para todos, tengan o no un usuario con ese módulo hoy.
INSERT INTO corporativo.cliente_modulos (cve_cliente, modulo_key)
SELECT cve_cliente, 'administracion' FROM corporativo.clientes
ON CONFLICT (cve_cliente, modulo_key) DO NOTHING;

ALTER TABLE corporativo.cliente_modulos           OWNER TO nuvio;
ALTER SEQUENCE corporativo.sq_corp_cliente_modulos OWNER TO nuvio;

COMMIT;
