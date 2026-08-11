"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/** No refrescar más seguido que esto, para no golpear al servidor si el usuario alterna pestañas rápido. */
const MIN_INTERVAL_MS = 5000;

/**
 * Experimento (2026-08-10, a pedir del usuario): los Server Components no se
 * vuelven a pedir solos — si algo cambia en otra pestaña/origen (ej. el
 * superadmin aprueba producción para un cliente) una pestaña ya abierta del
 * tenant se queda con los datos con los que se renderizó hasta que el usuario
 * hace F5 a mano. Este componente dispara `router.refresh()` cuando la
 * pestaña recupera el foco, para que los Server Components se re-rendericen
 * con datos frescos sin intervención manual.
 *
 * No renderiza nada — se monta una vez en el shell (dashboard/superadmin).
 */
export function RefreshOnFocus() {
  const router = useRouter();
  const lastRefresh = useRef(Date.now());

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastRefresh.current < MIN_INTERVAL_MS) return;
      lastRefresh.current = now;
      router.refresh();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [router]);

  return null;
}
