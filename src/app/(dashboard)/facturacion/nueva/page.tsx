import { requirePermission } from "@/features/auth";
import { FacturaForm } from "@/features/facturacion";

export const metadata = { title: "Nueva factura" };

export default async function NuevaFacturaPage() {
  await requirePermission("facturas.write");

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">Nueva factura</h1>
        <p className="mt-1 text-sm text-muted">Captura los conceptos y timbra el CFDI.</p>
      </div>

      <FacturaForm mode="create" />
    </div>
  );
}
