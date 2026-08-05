/**
 * Certificado de Sello Digital (CSD) por empresa/sucursal — necesario para
 * timbrar CFDI. Vive en columnas `sign_*` de `corporativo.empresas`;
 * protegido por el mismo permiso `empresas.write` que Sucursales.
 */
export { CsdUploader } from "./components/CsdUploader";
