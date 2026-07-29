import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { TENANT_HEADER } from "@/lib/tenant/constants";
import { slugFromHost } from "@/lib/tenant/host";

/** Prefijos del área autenticada (requieren cookie de sesión). */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/administracion",
  "/facturacion",
  "/pos",
  "/inventario",
  "/perfil",
  "/no-autorizado",
];

const isProtected = (pathname: string) =>
  PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

/**
 * Borde de la app: (1) resuelve el tenant del subdominio y lo publica como
 * header interno para que el servidor lo lea; (2) corta el paso al área
 * autenticada sin cookie de sesión. La validación real (sesión + tenant contra
 * la BD) ocurre en el layout del dashboard.
 */
export function proxy(request: NextRequest) {
  const slug = slugFromHost(request.headers.get("host"));

  const requestHeaders = new Headers(request.headers);
  if (slug) requestHeaders.set(TENANT_HEADER, slug);
  else requestHeaders.delete(TENANT_HEADER);

  const { pathname } = request.nextUrl;
  if (isProtected(pathname) && !request.cookies.has(SESSION_COOKIE_NAME)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  // Todo salvo assets internos y estáticos, para poder fijar el header de tenant.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
