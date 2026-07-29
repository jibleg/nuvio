"use client";

import type { ReactNode } from "react";
import { useSession } from "./SessionProvider";

/**
 * Renderiza sus hijos solo si el usuario tiene el permiso indicado.
 * Es una ayuda de UI, no un control de seguridad: la autorización real se hace
 * también en el servidor (guards + validación en use-cases).
 */
export function Can({
  permiso,
  fallback = null,
  children,
}: {
  permiso: string;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const { permisos } = useSession();
  return <>{permisos.includes(permiso) ? children : fallback}</>;
}
