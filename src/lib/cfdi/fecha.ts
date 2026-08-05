/**
 * Fecha/hora del comprobante en el formato entero que usa `cfdi.factura`
 * (`fecha` AAAAMMDD, `hora` HHMMSS), siempre en hora local de México: el SAT
 * exige la hora del lugar de expedición, y un servidor en UTC timbraría con
 * la fecha adelantada durante la tarde/noche.
 */

const ZONA = "America/Mexico_City";

export interface FechaHoraCfdi {
  /** AAAAMMDD */
  fecha: number;
  /** HHMMSS */
  hora: number;
}

export function ahoraCfdi(): FechaHoraCfdi {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const p = (t: string) => parts.find((x) => x.type === t)?.value ?? "00";
  const yyyy = p("year");
  const mm = p("month");
  const dd = p("day");
  let hh = p("hour");
  if (hh === "24") hh = "00"; // en-CA puede emitir 24 a medianoche
  const mi = p("minute");
  const ss = p("second");
  return {
    fecha: Number(`${yyyy}${mm}${dd}`),
    hora: Number(`${hh}${mi}${ss}`),
  };
}

/** `Fecha` del comprobante en el formato `AAAA-MM-DDTHH:MM:SS` que exige el XML. */
export function fechaCfdi(stamp: FechaHoraCfdi): string {
  const f = String(stamp.fecha);
  const h = String(stamp.hora).padStart(6, "0");
  return `${f.slice(0, 4)}-${f.slice(4, 6)}-${f.slice(6, 8)}T${h.slice(0, 2)}:${h.slice(2, 4)}:${h.slice(4, 6)}`;
}
