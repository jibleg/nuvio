/**
 * Convierte un monto a la leyenda "CANTIDAD CON LETRAS" que exigen las
 * representaciones impresas de CFDI (ver `demo-factura.pdf`): "ONCE MIL
 * TRESCIENTOS SESENTA Y OCHO PESOS 00/100 M.N."
 *
 * `UNIDADES[1] = "UN"` (no "UNO") a propósito: en este dominio el 1 siempre
 * antecede a un sustantivo (MIL, MILLONES o PESOS) y el español apocopa ahí
 * ("VEINTIUN PESOS", no "VEINTIUNO PESOS") — hornear la forma corta en la
 * tabla evita un paso aparte de post-proceso.
 */

const UNIDADES = ["", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"];
const DIEZ_A_DIECINUEVE = [
  "DIEZ",
  "ONCE",
  "DOCE",
  "TRECE",
  "CATORCE",
  "QUINCE",
  "DIECISEIS",
  "DIECISIETE",
  "DIECIOCHO",
  "DIECINUEVE",
];
const DECENAS = ["", "DIEZ", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
const CENTENAS = [
  "",
  "CIENTO",
  "DOSCIENTOS",
  "TRESCIENTOS",
  "CUATROCIENTOS",
  "QUINIENTOS",
  "SEISCIENTOS",
  "SETECIENTOS",
  "OCHOCIENTOS",
  "NOVECIENTOS",
];

function menorCien(n: number): string {
  if (n < 10) return UNIDADES[n];
  if (n < 20) return DIEZ_A_DIECINUEVE[n - 10];
  const decena = Math.floor(n / 10);
  const unidad = n % 10;
  if (decena === 2) return unidad === 0 ? "VEINTE" : `VEINTI${UNIDADES[unidad]}`;
  return unidad === 0 ? DECENAS[decena] : `${DECENAS[decena]} Y ${UNIDADES[unidad]}`;
}

function menorMil(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "CIEN";
  const centena = Math.floor(n / 100);
  const resto = n % 100;
  const partes: string[] = [];
  if (centena > 0) partes.push(CENTENAS[centena]);
  if (resto > 0) partes.push(menorCien(resto));
  return partes.join(" ");
}

function enteroALetras(n: number): string {
  if (n === 0) return "CERO";

  const millones = Math.floor(n / 1_000_000);
  const restoMillones = n % 1_000_000;
  const miles = Math.floor(restoMillones / 1000);
  const unidades = restoMillones % 1000;

  const partes: string[] = [];
  if (millones > 0) partes.push(millones === 1 ? "UN MILLON" : `${menorMil(millones)} MILLONES`);
  if (miles > 0) partes.push(miles === 1 ? "MIL" : `${menorMil(miles)} MIL`);
  if (unidades > 0) partes.push(menorMil(unidades));

  return partes.join(" ");
}

/** `11368.00` → `"ONCE MIL TRESCIENTOS SESENTA Y OCHO PESOS 00/100 M.N."`. Negativo o no finito → `"—"`. */
export function cantidadEnLetras(monto: number): string {
  if (!Number.isFinite(monto) || monto < 0) return "—";

  const entero = Math.floor(monto);
  const centavos = Math.round((monto - entero) * 100);
  const etiquetaPeso = entero === 1 ? "PESO" : "PESOS";

  return `${enteroALetras(entero)} ${etiquetaPeso} ${String(centavos).padStart(2, "0")}/100 M.N.`;
}
