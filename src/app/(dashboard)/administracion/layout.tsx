import type { ReactNode } from "react";
import { requireModulo } from "@/features/auth";
import { hasPermission } from "@/features/rbac";
import { ROUTES } from "@/config/routes";
import {
  ModuleShell,
  type SidebarItem,
} from "@/features/modulos/components/ModuleShell";

export default async function AdministracionLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireModulo("administracion");

  const items: SidebarItem[] = [
    { label: "Inicio", href: ROUTES.administracion, icon: "home", exact: true },
  ];
  if (hasPermission(session.permisos, "usuarios.acceso")) {
    items.push({ label: "Usuarios", href: ROUTES.usuarios, icon: "users" });
  }
  if (hasPermission(session.permisos, "perfiles.acceso")) {
    items.push({ label: "Perfiles", href: ROUTES.perfiles, icon: "user-cog" });
    items.push({ label: "Permisos", href: ROUTES.permisos, icon: "key" });
  }

  return (
    <ModuleShell titulo="Administración" items={items}>
      {children}
    </ModuleShell>
  );
}
