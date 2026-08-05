-- 0009_facturacion_schema.sql
-- Cimientos de datos para el módulo Facturación (CFDI 4.0 + Finkok):
--
-- 1. `sign_password_enc`: columna nueva para guardar la contraseña de la
--    llave privada (.key) del CSD CIFRADA (AES-256-GCM, ver
--    `src/lib/crypto/secrets.ts`). La columna legada `sign_password` guarda
--    hoy esa misma contraseña EN CLARO para las 7 empresas reales del tenant
--    "Grupo" — inaceptable en un sistema multi-tenant. El backfill que cifra
--    esos valores y limpia `sign_password` corre aparte, una sola vez, vía
--    `scripts/backfill-csd-password.ts` (no en esta migración: requiere la
--    llave de cifrado en tiempo de ejecución, no solo SQL).
-- 2. `ambiente_timbrado`: gate por cliente para no timbrar CFDI reales en
--    producción hasta que Nuvio (superadmin) lo habilite explícitamente.
-- 3. `empresa_folios`: contador de folio transaccional por empresa,
--    reemplaza el patrón de secuencia Postgres dinámica por-empresa que usa
--    facturacion-facil (`sign_namesequence` + nextval interpolado).
-- 4. `pg_trgm` + índices: búsqueda por substring rápida sobre los catálogos
--    SAT ya sembrados `cfdi.servicio` (52,514 filas, clave prod/serv) y
--    `cfdi.unidad` (2,419 filas, clave unidad) para el typeahead de conceptos.

BEGIN;

ALTER TABLE corporativo.empresas
  ADD COLUMN IF NOT EXISTS sign_password_enc bytea;

ALTER TABLE corporativo.clientes
  ADD COLUMN IF NOT EXISTS ambiente_timbrado varchar(10) NOT NULL DEFAULT 'sandbox'
    CHECK (ambiente_timbrado IN ('sandbox', 'produccion'));

CREATE TABLE IF NOT EXISTS corporativo.empresa_folios (
  cve_empresa      integer PRIMARY KEY REFERENCES corporativo.empresas(cve_empresa),
  siguiente_folio  integer NOT NULL DEFAULT 1
);

-- No existe el schema `public` en esta BD (heredado de factura-facil), así
-- que la extensión debe crearse en un schema explícito.
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA cfdi;

CREATE INDEX IF NOT EXISTS ix_cfdi_servicio_desc_trgm
  ON cfdi.servicio USING gin (descripcion_servicio cfdi.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS ix_cfdi_unidad_desc_trgm
  ON cfdi.unidad USING gin (descripcion_unidad cfdi.gin_trgm_ops);

ALTER TABLE corporativo.empresa_folios OWNER TO nuvio;

COMMIT;
