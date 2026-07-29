import { redirect } from "next/navigation";
import { LoginScreen, getCurrentSessionContext } from "@/features/auth";
import { ROUTES } from "@/config/routes";

export const metadata = {
  title: "Acceso",
};

export default async function LoginPage() {
  const session = await getCurrentSessionContext();
  if (session) redirect(ROUTES.dashboard);

  return <LoginScreen />;
}
