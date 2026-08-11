-- 0014_empresa_ambiente_facturacion.sql
-- Modo de facturación por empresa (matriz o sucursal): permite al dueño del
-- tenant probar la facturación de una sucursal en 'sandbox' (Finkok demo,
-- sin validez fiscal) antes de activar 'produccion' (SAT real) para ella.
-- Nace en 'sandbox' igual que `corporativo.clientes.ambiente_timbrado`, cuyo
-- gate de cuenta sigue mandando: una sucursal solo puede pasar a 'produccion'
-- si el cliente ya está aprobado por Nuvio (validado en la capa de acciones).

BEGIN;

ALTER TABLE corporativo.empresas
  ADD COLUMN IF NOT EXISTS ambiente_timbrado varchar(10) NOT NULL DEFAULT 'sandbox'
    CHECK (ambiente_timbrado IN ('sandbox', 'produccion'));

COMMIT;
