-- 0011_cfdi_pk_defaults.sql
-- `cfdi.factura`, `cfdi.concepto` y `cfdi.concepto_impuestos` traen sus
-- secuencias (`sq_cfdi_factura`, `sq_cfdi_concepto`,
-- `sq_cfdi_concepto_impuestos`) ya sincronizadas con los datos reales de
-- "Grupo" (verificado: `last_value` de cada secuencia == `max(id)` de su
-- tabla), pero NUNCA se conectaron como `DEFAULT` de la columna — la app
-- legada debía llamar `nextval()` a mano en cada INSERT. Drizzle, en cambio,
-- omite la columna del INSERT y confía en que la BD tenga un default real
-- (como sí lo tienen `corporativo.clientes`/`contactos_facturacion`); sin
-- esto, insertar una factura nueva revienta con `null value in column
-- "cve_factura" violates not-null constraint`.

BEGIN;

ALTER TABLE cfdi.factura
  ALTER COLUMN cve_factura SET DEFAULT nextval('cfdi.sq_cfdi_factura');

ALTER TABLE cfdi.concepto
  ALTER COLUMN cve_concepto SET DEFAULT nextval('cfdi.sq_cfdi_concepto');

ALTER TABLE cfdi.concepto_impuestos
  ALTER COLUMN cve_concepto_impuesto SET DEFAULT nextval('cfdi.sq_cfdi_concepto_impuestos');

COMMIT;
