"use client";

import { useEffect } from "react";

/**
 * Última red de seguridad: solo entra si el propio `RootLayout` truena (un
 * `error.tsx` normal no puede atraparlo, porque vive DENTRO del layout que
 * falló). Reemplaza el layout raíz entero, así que debe traer su propio
 * `<html>`/`<body>` y no puede depender de Tailwind, fuentes ni componentes
 * de la app — nada de eso puede darse por seguro si esto se está mostrando.
 * Estilos inline a propósito.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.75rem",
          padding: "1.5rem",
          textAlign: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
          background: "#f7fafa",
          color: "#0f2a2e",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>Algo salió mal</h1>
        <p style={{ maxWidth: "28rem", color: "#5b6b6d", margin: 0 }}>
          Nuvio tuvo un problema inesperado. Intenta de nuevo en unos segundos.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: "0.5rem",
            borderRadius: "9999px",
            border: "none",
            background: "#1a7c8a",
            color: "#fff",
            fontWeight: 600,
            padding: "0.75rem 1.5rem",
            fontSize: "0.95rem",
            cursor: "pointer",
          }}
        >
          Reintentar
        </button>
      </body>
    </html>
  );
}
