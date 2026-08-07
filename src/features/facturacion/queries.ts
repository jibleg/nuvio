import {
  getCuentasPorCobrarPorAntiguedad,
  getFacturadoPorDia,
  getResumenFacturacion,
  getTopClientes,
  type AntiguedadBucket,
  type ClienteTop,
  type FacturadoDia,
  type ResumenFacturacion,
} from "./repositories/dashboard-repository";
import { listEmisores } from "./repositories/emisor-repository";
import {
  findFacturaPorFolioFiscal,
  findSustitutoTimbrado,
  getFacturaDetalle,
  listFacturas,
  listFacturasTimbradasEnRango,
} from "./repositories/facturas-repository";
import {
  getPagoDetalle,
  getSaldoPendiente,
  listFacturasPorPagar,
  listPagos,
  listPagosDeFactura,
  listPagosTimbradosEnRango,
} from "./repositories/pagos-repository";
import type { EmisorListItem } from "./repositories/emisor-repository";
import type {
  FacturaDetalle,
  FacturaListItem,
  FacturaPorPagar,
  FacturaResumenRelacion,
  PagoAplicado,
  PagoDetalle,
  PagoListItem,
} from "./types";

export function getFacturasList(idCliente: number): Promise<FacturaListItem[]> {
  return listFacturas(idCliente);
}

export function getFacturaById(id: number, idCliente: number): Promise<FacturaDetalle | null> {
  return getFacturaDetalle(id, idCliente);
}

export function getEmisoresList(idCliente: number): Promise<EmisorListItem[]> {
  return listEmisores(idCliente);
}

export function getPagosList(idCliente: number): Promise<PagoListItem[]> {
  return listPagos(idCliente);
}

export function getPagoById(id: number, idCliente: number): Promise<PagoDetalle | null> {
  return getPagoDetalle(id, idCliente);
}

export function getFacturasPorPagar(idCliente: number, idContactoFacturacion?: number): Promise<FacturaPorPagar[]> {
  return listFacturasPorPagar(idCliente, idContactoFacturacion);
}

export function getSaldoPendienteFactura(idFactura: number, idCliente: number): Promise<number | null> {
  return getSaldoPendiente(idFactura, idCliente);
}

export function getPagosDeFactura(idFactura: number, idCliente: number): Promise<PagoAplicado[]> {
  return listPagosDeFactura(idFactura, idCliente);
}

/** La factura original a la que este CFDI sustituye (por su folio fiscal), si aplica. */
export function getFacturaOriginal(folioFiscal: string, idCliente: number): Promise<FacturaResumenRelacion | null> {
  return findFacturaPorFolioFiscal(folioFiscal, idCliente);
}

/** El sustituto YA TIMBRADO de esta factura, si ya se refacturó y timbró. */
export function getSustitutoTimbrado(folioFiscal: string, idCliente: number): Promise<FacturaResumenRelacion | null> {
  return findSustitutoTimbrado(folioFiscal, idCliente);
}

// ---- Dashboard ----

export function getResumenDashboard(idCliente: number): Promise<ResumenFacturacion> {
  return getResumenFacturacion(idCliente);
}

export function getFacturadoDiario(idCliente: number, dias?: number): Promise<FacturadoDia[]> {
  return getFacturadoPorDia(idCliente, dias);
}

export function getClientesTop(idCliente: number, limite?: number, dias?: number): Promise<ClienteTop[]> {
  return getTopClientes(idCliente, limite, dias);
}

export function getCuentasPorCobrar(idCliente: number): Promise<{ buckets: AntiguedadBucket[]; total: number }> {
  return getCuentasPorCobrarPorAntiguedad(idCliente);
}

// ---- Paquete contable ----

export function getFacturasTimbradasEnRango(
  idCliente: number,
  desde: string,
  hasta: string,
  idEmpresaEmisora?: number,
): Promise<{ id: number; folioFiscal: string | null }[]> {
  return listFacturasTimbradasEnRango(idCliente, desde, hasta, idEmpresaEmisora);
}

export function getPagosTimbradosEnRango(
  idCliente: number,
  desde: string,
  hasta: string,
  idEmpresaEmisora?: number,
): Promise<{ id: number; folioFiscal: string | null }[]> {
  return listPagosTimbradosEnRango(idCliente, desde, hasta, idEmpresaEmisora);
}
