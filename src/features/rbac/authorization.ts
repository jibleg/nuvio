/**
 * Lógica pura de autorización. Sin dependencias de red ni de sesión: recibe la
 * lista de permisos ya resuelta y responde si un código está concedido.
 * Se usa igual en servidor (guards) y en cliente (`<Can>`).
 */
export function hasPermission(permisos: string[], codigo: string): boolean {
  return permisos.includes(codigo);
}

/** ¿Tiene al menos uno de los códigos indicados? */
export function hasAnyPermission(permisos: string[], codigos: string[]): boolean {
  return codigos.some((codigo) => permisos.includes(codigo));
}
