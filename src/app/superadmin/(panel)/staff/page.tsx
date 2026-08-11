import { StaffAdmin, getStaffList, requireSuperAdminSession } from "@/features/superadmin";

export const metadata = {
  title: "Panel interno — Staff",
};

export default async function SuperAdminStaffPage() {
  const [{ superAdmin }, staff] = await Promise.all([requireSuperAdminSession(), getStaffList()]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">Staff</h1>
        <p className="mt-1 text-sm text-muted">
          Cuentas con acceso al panel interno de Nuvio — gestión de todos los clientes.
        </p>
      </div>

      <StaffAdmin staff={staff} currentId={superAdmin.id} />
    </div>
  );
}
