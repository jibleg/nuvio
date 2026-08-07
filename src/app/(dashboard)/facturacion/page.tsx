import { requirePermission } from "@/features/auth";
import { Dashboard } from "@/features/facturacion/components/Dashboard";
import {
  getClientesTop,
  getCuentasPorCobrar,
  getFacturadoDiario,
  getResumenDashboard,
} from "@/features/facturacion/queries";

export const metadata = { title: "Facturación" };

export default async function FacturacionDashboardPage() {
  const session = await requirePermission("facturas.consulta");
  const puedeGestionar = session.permisos.includes("facturas.write");

  const [resumen, facturadoDiario, cuentasPorCobrar, topClientes] = await Promise.all([
    getResumenDashboard(session.cliente.id),
    getFacturadoDiario(session.cliente.id),
    getCuentasPorCobrar(session.cliente.id),
    getClientesTop(session.cliente.id),
  ]);

  const hoy = new Date();
  const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
  const hoyIso = hoy.toISOString().slice(0, 10);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">Resumen</h1>
        <p className="mt-1 text-sm text-muted">La situación de tu facturación, de un vistazo.</p>
      </div>

      <Dashboard
        resumen={resumen}
        facturadoDiario={facturadoDiario}
        cuentasPorCobrar={cuentasPorCobrar}
        topClientes={topClientes}
        puedeGestionar={puedeGestionar}
        paqueteDesdeDefault={primerDiaMes}
        paqueteHastaDefault={hoyIso}
      />
    </div>
  );
}
