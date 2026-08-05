-- 0012_contacto_defaults_cfdi.sql
-- Datos de facturación por defecto de un contacto (cliente): uso de CFDI,
-- forma de pago y método de pago habituales para facturarle. Se capturan una
-- vez en el contacto y prellenan el formulario de factura nueva al
-- seleccionarlo — siguen siendo editables por factura, esto solo evita
-- repetir la captura cada vez. `cve_regimen` ya existía (migración 0010).

BEGIN;

ALTER TABLE corporativo.contactos_facturacion
  ADD COLUMN IF NOT EXISTS cve_uso integer REFERENCES cfdi.uso(cve_uso),
  ADD COLUMN IF NOT EXISTS cve_forma_pago integer REFERENCES cfdi.forma_pago(cve_forma_pago),
  ADD COLUMN IF NOT EXISTS cve_metodo integer REFERENCES cfdi.metodo_pago(cve_metodo);

COMMIT;
