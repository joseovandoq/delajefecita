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
  gastos,
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
  // Todas las consultas son independientes: en paralelo para no pagar un
  // viaje a la base por cada una.
  // Etapas de maximo 4 consultas simultaneas (ver nota en resumen/queries.ts).
  const [[ingresoRow], sumasPorLote, lotesInfo, ventasRows] = await Promise.all([
    db
      .select({
        total: sql<string>`coalesce(sum(${ventas.cantidad} * ${ventas.precioUnitario}), 0)`,
      })
      .from(ventas),
    db
      .select({
        loteId: movimientosInsumo.loteId,
        costoInsumos: sql<string>`coalesce(sum(${movimientosInsumo.cantidad} * ${movimientosInsumo.costoUnitario}), 0)`,
      })
      .from(movimientosInsumo)
      .where(
        and(eq(movimientosInsumo.tipo, "salida"), isNotNull(movimientosInsumo.loteId))
      )
      .groupBy(movimientosInsumo.loteId),
    db.select({ id: lotes.id, cantidad: lotes.cantidad }).from(lotes),
    db.select({ loteId: ventas.loteId, cantidad: ventas.cantidad }).from(ventas),
  ]);
  const [[costosFijosRow], [costosEventosRow], gastosPorTipo] = await Promise.all([
    db
      .select({ total: sql<string>`coalesce(sum(${costosFijos.monto}), 0)` })
      .from(costosFijos),
    db
      .select({ total: sql<string>`coalesce(sum(${costosEvento.monto}), 0)` })
      .from(costosEvento),
    db
      .select({
        tipo: gastos.tipo,
        total: sql<string>`coalesce(sum(${gastos.monto}), 0)`,
      })
      .from(gastos)
      .groupBy(gastos.tipo),
  ]);

  const ingresoTotal = Number(ingresoRow?.total ?? 0);

  const costoInsumosPorLoteId = new Map(
    sumasPorLote.map((fila) => [fila.loteId, Number(fila.costoInsumos)])
  );
  const costoUnitarioPorLoteId = new Map<string, number>();
  for (const lote of lotesInfo) {
    const costoInsumos = costoInsumosPorLoteId.get(lote.id) ?? 0;
    const cantidad = Number(lote.cantidad);
    costoUnitarioPorLoteId.set(lote.id, cantidad > 0 ? costoInsumos / cantidad : 0);
  }
  const costoInsumosVendidos = ventasRows.reduce(
    (acc, v) => acc + Number(v.cantidad) * (costoUnitarioPorLoteId.get(v.loteId) ?? 0),
    0
  );

  const costosFijosTotal = Number(costosFijosRow?.total ?? 0);
  const costosEventosTotal = Number(costosEventosRow?.total ?? 0);
  const gastosProduccion = Number(
    gastosPorTipo.find((g) => g.tipo === "produccion")?.total ?? 0
  );
  const gastosVariables = Number(
    gastosPorTipo.find((g) => g.tipo === "variable")?.total ?? 0
  );

  // Costo de produccion: insumos de lo vendido + gas/luz/agua + gastos
  // marcados "produccion". Gastos variables: eventos + promo/marketing/web.
  const costoProduccion = costoInsumosVendidos + costosFijosTotal + gastosProduccion;
  const gastosVariablesTotal = costosEventosTotal + gastosVariables;
  const utilidad = ingresoTotal - costoProduccion - gastosVariablesTotal;

  return {
    ingresoTotal,
    costoInsumosVendidos,
    costosFijosTotal,
    costosEventosTotal,
    gastosProduccion,
    gastosVariables,
    costoProduccion,
    gastosVariablesTotal,
    utilidad,
  };
}
