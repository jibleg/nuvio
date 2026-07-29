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
    {
      label: "Inicio",
      href: ROUTES.administracion,
      icon: "home",
      accent: "brand",
      exact: true,
    },
  ];
  if (hasPermission(session.permisos, "usuarios.acceso")) {
    items.push({
      label: "Usuarios",
      href: ROUTES.usuarios,
      icon: "users",
      accent: "aurora",
    });
  }
  if (hasPermission(session.permisos, "perfiles.acceso")) {
    items.push({
      label: "Perfiles",
      href: ROUTES.perfiles,
      icon: "user-cog",
      accent: "sky",
    });
  }

  return (
    <ModuleShell titulo="Administración" icon="shield" items={items}>
      {children}
    </ModuleShell>
  );
}
