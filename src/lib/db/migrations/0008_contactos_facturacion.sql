-- 0008_contactos_facturacion.sql
-- Separa "clientes y proveedores de facturación" (a quién facturas / quién
-- te factura) de `corporativo.empresas` (tu propia matriz/sucursales).
-- factura-facil mezclaba ambos conceptos en una sola tabla vía `empresas.tipo`
-- (1 = propia, 2 = contacto); esta migración les da su propia tabla y
-- migra los contactos legados que ya existían (tenant "Grupo").
--
-- Deliberadamente NO se borran ni se tocan las filas legadas en
-- `corporativo.empresas` ni sus referencias en `cfdi.factura`
-- (empresa_destino/empresa_proveedora): esas 33 facturas históricas siguen
-- apuntando exactamente a donde apuntaban. Repuntar esas FKs a la tabla
-- nueva es un paso deliberadamente diferido para cuando se construya el
-- módulo de Facturación de verdad.

BEGIN;

CREATE SEQUENCE IF NOT EXISTS corporativo.sq_corp_contactos_facturacion;

CREATE TABLE IF NOT EXISTS corporativo.contactos_facturacion (
  cve_contacto_facturacion integer PRIMARY KEY DEFAULT nextval('corporativo.sq_corp_contactos_facturacion'),
  cve_cliente       integer      NOT NULL REFERENCES corporativo.clientes(cve_cliente),
  -- 1 = cliente (a quien facturas), 2 = proveedor (quien te factura).
  tipo              smallint     NOT NULL CHECK (tipo IN (1, 2)),
  razon_social      varchar(200) NOT NULL,
  rfc               varchar(25)  NOT NULL,
  nombre_comercial  varchar(150),
  calle             varchar(250),
  colonia           varchar(50),
  ciudad            varchar(50),
  codigo_postal     integer,
  telefono          varchar(50),
  email             varchar(200),
  activo            smallint     NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS ix_contactos_facturacion_cliente
  ON corporativo.contactos_facturacion (cve_cliente, tipo);

-- Backfill: los contactos que ya existían en `empresas` con tipo=2 (hoy solo
-- el tenant "Grupo", migrado desde factura-facil antes de que existiera este
-- modelo) pasan a vivir aquí.
INSERT INTO corporativo.contactos_facturacion
  (cve_cliente, tipo, razon_social, rfc, nombre_comercial, calle, colonia, ciudad, codigo_postal, telefono, email, activo)
SELECT
  cve_cliente,
  2,
  coalesce(nullif(razon_social, ''), nombre_comercial),
  coalesce(nullif(rfc, ''), 'XAXX010101000'),
  nombre_comercial,
  calle, colonia, ciudad, codigo_postal, telefono, email,
  coalesce(activo, 1)
FROM corporativo.empresas
WHERE tipo = 2;

ALTER TABLE corporativo.contactos_facturacion           OWNER TO nuvio;
ALTER SEQUENCE corporativo.sq_corp_contactos_facturacion OWNER TO nuvio;

COMMIT;
