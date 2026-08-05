-- 0010_factura_receptor_regimen.sql
-- Dos ajustes para poder emitir facturas NUEVAS (módulo Facturación real):
--
-- 1. `cfdi.factura.cve_empresa` es, pese a su nombre y al de su FK
--    (`fk_factura_empresadestino`), el RECEPTOR de la factura — verificado
--    contra las 33 facturas reales de "Grupo" (ver
--    src/lib/db/schema/cfdi.ts). Apunta a `corporativo.empresas`, que desde
--    la migración 0008 ya NO es donde viven los contactos de facturación
--    nuevos (ahora en `corporativo.contactos_facturacion`). Las 33 facturas
--    históricas se quedan tal cual (su `cve_empresa` sigue apuntando a filas
--    reales de `empresas`, deliberadamente no tocadas); las facturas NUEVAS
--    usan la columna `cve_contacto_facturacion` en su lugar. Por eso
--    `cve_empresa` deja de ser NOT NULL: una factura nueva la deja NULL y
--    llena `cve_contacto_facturacion`.
-- 2. `contactos_facturacion` no tenía régimen fiscal — el CFDI 4.0 exige
--    `RegimenFiscalReceptor`, así que se agrega (nullable: los contactos que
--    ya existían antes de este módulo no lo tienen capturado todavía).

BEGIN;

ALTER TABLE cfdi.factura
  ALTER COLUMN cve_empresa DROP NOT NULL;

ALTER TABLE cfdi.factura
  ADD COLUMN IF NOT EXISTS cve_contacto_facturacion integer
    REFERENCES corporativo.contactos_facturacion(cve_contacto_facturacion);

CREATE INDEX IF NOT EXISTS ix_factura_contacto_facturacion
  ON cfdi.factura (cve_contacto_facturacion);

ALTER TABLE corporativo.contactos_facturacion
  ADD COLUMN IF NOT EXISTS cve_regimen integer REFERENCES cfdi.regimen_fiscal(cve_regimen);

COMMIT;
