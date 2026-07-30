-- 0007_sucursales.sql
-- Modelo de sucursales: una sucursal es una fila más de `corporativo.empresas`
-- (que ya tiene domicilio, RFC y razón social heredados de factura-facil).
-- cve_empresa_matriz NULL = esta fila es una matriz; con valor = es sucursal
-- de esa matriz. Sin backfill: las filas existentes quedan NULL (matrices),
-- que es el comportamiento implícito de hoy.

BEGIN;

ALTER TABLE corporativo.empresas
  ADD COLUMN IF NOT EXISTS cve_empresa_matriz integer NULL
    REFERENCES corporativo.empresas(cve_empresa);

CREATE INDEX IF NOT EXISTS ix_empresas_matriz
  ON corporativo.empresas (cve_empresa_matriz);

COMMIT;
