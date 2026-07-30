import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { replaceModulosForCliente } from "@/features/modulos";
import {
  clientes,
  empresas,
  perfilPermisos,
  perfilUsuarios,
  perfiles,
  permisos,
  usuarioEmpresas,
  usuarioModulos,
  usuarios,
} from "@/lib/db/schema";
import type { OnboardClienteData } from "../types";

/**
 * Alta de un cliente (tenant) nuevo en un solo paso: cliente + su primera
 * empresa + un perfil "Administrador" con TODO el catálogo de permisos
 * activos + su primer usuario, listo para iniciar sesión en su subdominio.
 * Todo dentro de una transacción: si algo falla, no queda un tenant a medias.
 */
export async function onboardCliente(
  data: OnboardClienteData & { passwordHash: string },
): Promise<{ clienteId: number; empresaId: number; usuarioId: number }> {
  return db.transaction(async (tx) => {
    const [{ id: clienteId }] = await tx
      .insert(clientes)
      .values({ slug: data.slug, nombre: data.clienteNombre, activo: 1, plan: data.plan })
      .returning({ id: clientes.id });

    const [{ maxId: maxEmpresaId }] = await tx
      .select({ maxId: sql<number>`coalesce(max(${empresas.id}), 0)::int` })
      .from(empresas);
    const empresaId = maxEmpresaId + 1;
    await tx.insert(empresas).values({
      id: empresaId,
      idCliente: clienteId,
      nombreComercial: data.empresaNombreComercial,
      descripcion: data.empresaNombreComercial,
      nombreCorto: data.empresaNombreCorto,
      razonSocial: data.empresaRazonSocial,
      rfc: data.empresaRfc,
      activo: 1,
    });

    const [{ maxId: maxPerfilId }] = await tx
      .select({ maxId: sql<number>`coalesce(max(${perfiles.id}), 0)::int` })
      .from(perfiles);
    const perfilId = maxPerfilId + 1;
    await tx.insert(perfiles).values({
      id: perfilId,
      idCliente: clienteId,
      nombre: "Administrador",
      descripcion: "Acceso completo al cliente.",
      activo: 1,
    });

    const permisoIds = (
      await tx.select({ id: permisos.id }).from(permisos).where(eq(permisos.activo, 1))
    ).map((row) => row.id);
    if (permisoIds.length > 0) {
      const [{ maxId: maxPermisoLinkId }] = await tx
        .select({ maxId: sql<number>`coalesce(max(${perfilPermisos.id}), 0)::int` })
        .from(perfilPermisos);
      await tx.insert(perfilPermisos).values(
        permisoIds.map((idPermiso, index) => ({
          id: maxPermisoLinkId + 1 + index,
          idPerfil: perfilId,
          idPermiso,
        })),
      );
    }

    const [{ maxId: maxUsuarioId }] = await tx
      .select({ maxId: sql<number>`coalesce(max(${usuarios.id}), 0)::int` })
      .from(usuarios);
    const usuarioId = maxUsuarioId + 1;
    await tx.insert(usuarios).values({
      id: usuarioId,
      idCliente: clienteId,
      login: "admin",
      passwordHash: data.passwordHash,
      nombre: data.adminNombre,
      descripcion: data.adminNombre,
      email: data.adminEmail,
      activo: 1,
      debeCambiarPassword: 0,
    });

    const [{ maxId: maxPerfilUsuarioId }] = await tx
      .select({ maxId: sql<number>`coalesce(max(${perfilUsuarios.id}), 0)::int` })
      .from(perfilUsuarios);
    await tx.insert(perfilUsuarios).values({
      id: maxPerfilUsuarioId + 1,
      idUsuario: usuarioId,
      idPerfil: perfilId,
    });

    await tx.insert(usuarioEmpresas).values({ idUsuario: usuarioId, idEmpresa: empresaId });

    // El cliente licencia estos módulos (paquete); "administracion" es base,
    // no un módulo de negocio que se venda aparte. Su primer administrador
    // nace con acceso a todo lo licenciado.
    const moduloKeys = Array.from(new Set(["administracion", ...data.modulos]));
    await replaceModulosForCliente(tx, clienteId, moduloKeys);
    await tx
      .insert(usuarioModulos)
      .values(moduloKeys.map((moduloKey) => ({ idUsuario: usuarioId, moduloKey })));

    return { clienteId, empresaId, usuarioId };
  });
}
