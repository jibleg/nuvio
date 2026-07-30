import { ClientesAdmin, getClientesList } from "@/features/superadmin";

export const metadata = {
  title: "Panel interno — Clientes",
};

export default async function SuperAdminClientesPage() {
  const clientes = await getClientesList();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">
          Clientes
        </h1>
        <p className="mt-1 text-sm text-muted">
          Da de alta nuevos clientes y administra su acceso a la plataforma.
        </p>
      </div>

      <ClientesAdmin clientes={clientes} />
    </div>
  );
}
