import { requirePermission } from "@/features/auth";
import { getSucursalesList, SucursalesAdmin } from "@/features/sucursales";

export const metadata = {
  title: "Sucursales",
};

export default async function SucursalesPage() {
  const session = await requirePermission("empresas.acceso");
  const puedeGestionar = session.permisos.includes("empresas.write");
  const sucursales = await getSucursalesList(session.cliente.id);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">
          Sucursales
        </h1>
        <p className="mt-1 text-sm text-muted">
          Administra la matriz y las sucursales de tu empresa.
        </p>
      </div>

      <SucursalesAdmin
        sucursales={sucursales}
        plan={session.cliente.plan}
        puedeGestionar={puedeGestionar}
      />
    </div>
  );
}
