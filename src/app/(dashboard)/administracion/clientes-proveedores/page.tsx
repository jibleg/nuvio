import { requirePermission } from "@/features/auth";
import { getContactosList, ContactosAdmin } from "@/features/contactos-facturacion";

export const metadata = {
  title: "Clientes y proveedores",
};

export default async function ClientesProveedoresPage() {
  const session = await requirePermission("catalogos.clientes");
  const puedeGestionar = session.permisos.includes("clientes.write");
  const contactos = await getContactosList(session.cliente.id);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">
          Clientes y proveedores
        </h1>
        <p className="mt-1 text-sm text-muted">
          Directorio de a quién facturas y quién te factura.
        </p>
      </div>

      <ContactosAdmin contactos={contactos} puedeGestionar={puedeGestionar} />
    </div>
  );
}
