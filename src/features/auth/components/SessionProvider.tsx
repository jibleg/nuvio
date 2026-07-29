"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { SessionContext } from "../types";

const Context = createContext<SessionContext | null>(null);

/**
 * Expone el contexto de sesión (cargado en el servidor) a los componentes de
 * cliente del área autenticada.
 */
export function SessionProvider({
  value,
  children,
}: {
  value: SessionContext;
  children: ReactNode;
}) {
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useSession(): SessionContext {
  const value = useContext(Context);
  if (!value) {
    throw new Error("useSession debe usarse dentro de <SessionProvider>.");
  }
  return value;
}
