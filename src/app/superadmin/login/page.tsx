import { redirect } from "next/navigation";
import { ROUTES } from "@/config/routes";
import { SuperAdminLoginScreen, getCurrentSuperAdminSession } from "@/features/superadmin";

export const metadata = {
  title: "Panel interno — Acceso",
};

export default async function SuperAdminLoginPage() {
  const session = await getCurrentSuperAdminSession();
  if (session) redirect(ROUTES.superadmin);

  return <SuperAdminLoginScreen />;
}
