/**
 * Administración de sucursales: una sucursal es una fila de `corporativo.empresas`
 * con `idEmpresaMatriz` apuntando a la matriz del cliente. Mutaciones protegidas
 * por el permiso `empresas.write`.
 */
export { getSucursalesList, getSucursalById } from "./queries";
export { SucursalesAdmin } from "./components/SucursalesAdmin";
