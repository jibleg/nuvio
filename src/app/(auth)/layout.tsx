import type { ReactNode } from "react";

/** Layout de las pantallas de acceso. Lienzo completo; el diseño vive en cada page. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh bg-paper text-ink">{children}</div>;
}
