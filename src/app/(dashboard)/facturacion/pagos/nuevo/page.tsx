import { Suspense } from "react";
import { requirePermission } from "@/features/auth";
import { PagoForm } from "@/features/facturacion/components/PagoForm";

export const metadata = { title: "Registrar pago" };

export default async function NuevoPagoPage() {
  await requirePermission("facturas.write");

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">Registrar pago</h1>
        <p className="mt-1 text-sm text-muted">Genera un complemento de pago (CFDI tipo P) para facturas a crédito.</p>
      </div>

      <Suspense>
        <PagoForm />
      </Suspense>
    </div>
  );
}
