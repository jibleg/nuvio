import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ROUTES } from "@/config/routes";
import { ProfileView } from "@/features/auth/components/ProfileView";

export const metadata = { title: "Perfil" };

export default function PerfilPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href={ROUTES.dashboard}
        className="group mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Volver al portal
      </Link>
      <ProfileView />
    </div>
  );
}
