import { deleteCliente } from "../repositories/clientes-repository";
import type { SuperAdminMutationResult } from "../types";

const FOREIGN_KEY_VIOLATION = "23503";

function isForeignKeyViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === FOREIGN_KEY_VIOLATION
  );
}

/**
 * Elimina un cliente por completo. Si tiene datos de negocio en módulos
 * legados aún no migrados (facturas, contratos...), la FK correspondiente
 * revierte la transacción y aquí se traduce en un error legible.
 */
export async function deleteClienteUseCase(id: number): Promise<SuperAdminMutationResult> {
  try {
    await deleteCliente(id);
    return { ok: true, id };
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      return {
        ok: false,
        error:
          "No se puede eliminar: este cliente tiene datos asociados (facturas, contratos u otros registros).",
      };
    }
    throw error;
  }
}
