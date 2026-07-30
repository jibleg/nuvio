-- 0006_planes_cliente.sql
-- Plan comercial contratado por cada cliente (tenant): limita cuántas
-- empresas puede crear y cuántos módulos de negocio puede licenciar (ver
-- src/config/plans.ts para el catálogo con los límites de cada plan).
-- "administracion" nunca cuenta contra el límite de módulos; Nuvio no limita
-- la operación dentro de un módulo, solo el tamaño del ecosistema.

BEGIN;

ALTER TABLE corporativo.clientes
  ADD COLUMN IF NOT EXISTS plan varchar(20) NOT NULL DEFAULT 'empresarial';

-- Backfill: los clientes que ya existían antes de este concepto de plan no
-- deben quedar retroactivamente limitados por debajo de lo que ya usan hoy.
UPDATE corporativo.clientes SET plan = 'empresarial';

ALTER TABLE corporativo.clientes
  ADD CONSTRAINT chk_clientes_plan CHECK (plan IN ('emprendedor', 'contigo_plus', 'empresarial'));

COMMIT;
