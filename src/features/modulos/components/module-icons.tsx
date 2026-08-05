import {
  FileText,
  Handshake,
  Home,
  KeyRound,
  LayoutGrid,
  Package,
  PlusCircle,
  Search,
  Shield,
  ShoppingCart,
  SlidersHorizontal,
  Store,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  shield: Shield,
  "file-text": FileText,
  "shopping-cart": ShoppingCart,
  package: Package,
  home: Home,
  users: Users,
  "user-cog": UserCog,
  key: KeyRound,
  sliders: SlidersHorizontal,
  grid: LayoutGrid,
  store: Store,
  handshake: Handshake,
  search: Search,
  "plus-circle": PlusCircle,
};

/** Resuelve una clave de icono a su icono de lucide (módulo plano, server/client). */
export function ModuleIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICONS[name] ?? LayoutGrid;
  return <Icon className={className} />;
}
