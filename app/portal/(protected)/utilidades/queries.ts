import "server-only";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  categoriasReparto,
  ventas,
  movimientosInsumo,
  lotes,
  costosFijos,
  costosEvento,
} from "@/lib/db/schema";

export async function listarCategoriasReparto() {
  return db.select().from(categoriasReparto).orderBy(categoriasReparto.nombre);
}

/**
 * Utilidad = ingreso por ventas - costo de insumos de lo vendido -
 * costos fijos - costos de eventos. Es un calculo de todo el
 * historial (no por mes todavia); el costo de insumos por lote es el
 * mismo que usa el modulo de costos (cantidad x costoUnitario
 * congelado en cada movimiento, entre la cantidad producida del lote).
 */
export async function calcularUtilidad() {
  const [ingresoRow] = await db
    .select({
      total: sql<string>`coalesce(sum(${ventas.cantidad} * ${ventas.precioUnitario}), 0)`,
    })
    .from(ventas);
  const ingresoTotal = Number(ingresoRow?.total ?? 0);

  const sumasPorLote = await db
    .select({
      loteId: movimientosInsumo.loteId,
      costoInsumos: sql<string>`coalesce(sum(${movimientosInsumo.cantidad} * ${movimientosInsumo.costoUnitario}), 0)`,
    })
    .from(movimientosInsumo)
    .where(
      and(eq(movimientosInsumo.tipo, "salida"), isNotNull(movimientosInsumo.loteId))
    )
    .groupBy(movimientosInsumo.loteId);
  const costoInsumosPorLoteId = new Map(
    sumasPorLote.map((fila) => [fila.loteId, Number(fila.costoInsumos)])
  );

  const lotesInfo = await db.select({ id: lotes.id, cantidad: lotes.cantidad }).from(lotes);
  const costoUnitarioPorLoteId = new Map<string, number>();
  for (const lote of lotesInfo) {
    const costoInsumos = costoInsumosPorLoteId.get(lote.id) ?? 0;
    const cantidad = Number(lote.cantidad);
    costoUnitarioPorLoteId.set(lote.id, cantidad > 0 ? costoInsumos / cantidad : 0);
  }

  const ventasRows = await db.select({ loteId: ventas.loteId, cantidad: ventas.cantidad }).from(ventas);
  const costoInsumosVendidos = ventasRows.reduce(
    (acc, v) => acc + Number(v.cantidad) * (costoUnitarioPorLoteId.get(v.loteId) ?? 0),
    0
  );

  const [costosFijosRow] = await db
    .select({ total: sql<string>`coalesce(sum(${costosFijos.monto}), 0)` })
    .from(costosFijos);
  const costosFijosTotal = Number(costosFijosRow?.total ?? 0);

  const [costosEventosRow] = await db
    .select({ total: sql<string>`coalesce(sum(${costosEvento.monto}), 0)` })
    .from(costosEvento);
  const costosEventosTotal = Number(costosEventosRow?.total ?? 0);

  const utilidad =
    ingresoTotal - costoInsumosVendidos - costosFijosTotal - costosEventosTotal;

  return {
    ingresoTotal,
    costoInsumosVendidos,
    costosFijosTotal,
    costosEventosTotal,
    utilidad,
  };
}
