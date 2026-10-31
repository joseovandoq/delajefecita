/**
 * Precio total por cantidad con precio de volumen: `precioVenta` c/u
 * por debajo de `mayoreoDesde`, `precioMayoreo` c/u desde ahi.
 * Ej. 80 normal, 75 c/u desde 2 => 1x 80, 2x 150, 3x 225, 4x 300.
 */
export function totalPorCantidad(
  precioVenta: number | null,
  precioMayoreo: number | null,
  mayoreoDesde: number,
  cantidad: number
): number | null {
  if (precioVenta === null || cantidad <= 0) return null;
  const unitario =
    precioMayoreo !== null && cantidad >= mayoreoDesde ? precioMayoreo : precioVenta;
  return Math.round(unitario * cantidad * 100) / 100;
}
