/**
 * Acceso a módulos de aplicación (portal). El acceso es una asociación explícita
 * operador↔módulo; las definiciones de módulo viven en `@/config/modules`.
 */
export {
  findModuloKeysByUsuario,
  usuarioTieneModulo,
  replaceModulosForUsuario,
} from "./repositories/usuario-modulos-repository";
export {
  findModuloKeysByCliente,
  replaceModulosForCliente,
} from "./repositories/cliente-modulos-repository";
