-- 0013_pago_pk_defaults.sql
-- Igual que la 0011 (cve_factura/cve_concepto/cve_concepto_impuestos): las
-- tablas heredadas `cfdi.pago` y `cfdi.documento_relacionado` tienen su
-- secuencia (sq_cfdi_pago, sq_cfdi_documento_relacionado) pero nunca se
-- conectó como DEFAULT de la columna — la app legada llamaba nextval() a
-- mano. Drizzle omite la columna del INSERT y confía en un DEFAULT real de
-- la BD; sin esto, crear un complemento de pago revienta con
-- "null value in column ... violates not-null constraint".

BEGIN;

ALTER TABLE cfdi.pago
  ALTER COLUMN cve_pago SET DEFAULT nextval('cfdi.sq_cfdi_pago');

ALTER TABLE cfdi.documento_relacionado
  ALTER COLUMN cve_documento_relacionado SET DEFAULT nextval('cfdi.sq_cfdi_documento_relacionado');

COMMIT;
