import "server-only";
import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  costosFijos,
  socios,
  lotes,
  productos,
  movimientosInsumo,
} from "@/lib/db/schema";

export async function listarCostosFijos() {
  return db
    .select({
      id: costosFijos.id,
      concepto: costosFijos.concepto,
      monto: costosFijos.monto,
      fecha: costosFijos.fecha,
      notas: costosFijos.notas,
      responsable: { nombre: socios.nombre },
    })
    .from(costosFijos)
    .leftJoin(socios, eq(costosFijos.responsableId, socios.id))
    .orderBy(desc(costosFijos.fecha));
}

export async function obtenerCostoFijo(id: string) {
  const [costo] = await db
    .select()
    .from(costosFijos)
    .where(eq(costosFijos.id, id))
    .limit(1);
  return costo;
}

export async function listarProductosConPrecio() {
  return db
    .select({
      id: productos.id,
      nombre: productos.nombre,
      precioVenta: productos.precioVenta,
    })
    .from(productos)
    .where(eq(productos.activo, true))
    .orderBy(productos.nombre);
}

/**
 * Costo de insumos y margen por lote. El costo se calcula sumando
 * cantidad x costoUnitario (congelado al momento del movimiento) de
 * todas las salidas de insumo ligadas a ese lote -- tanto los
 * ingredientes automaticos como el empaque que se haya ligado a mano.
 */
export async function listarCostoPorLote() {
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

  const costoPorLoteId = new Map(
    sumasPorLote.map((fila) => [fila.loteId, Number(fila.costoInsumos)])
  );

  const lotesData = await db
    .select({
      id: lotes.id,
      cantidad: lotes.cantidad,
      unidad: lotes.unidad,
      fechaProduccion: lotes.fechaProduccion,
      productoNombre: productos.nombre,
      precioVenta: productos.precioVenta,
    })
    .from(lotes)
    .leftJoin(productos, eq(lotes.productoId, productos.id))
    .orderBy(desc(lotes.fechaProduccion))
    .limit(100);

  return lotesData.map((lote) => {
    const costoInsumos = costoPorLoteId.get(lote.id) ?? 0;
    const cantidad = Number(lote.cantidad);
    const costoUnitario = cantidad > 0 ? costoInsumos / cantidad : 0;
    const precioVenta = lote.precioVenta !== null ? Number(lote.precioVenta) : null;
    const margenUnitario = precioVenta !== null ? precioVenta - costoUnitario : null;
    const margenPct =
      precioVenta !== null && precioVenta > 0
        ? ((margenUnitario as number) / precioVenta) * 100
        : null;

    return {
      id: lote.id,
      cantidad: lote.cantidad,
      unidad: lote.unidad,
      fechaProduccion: lote.fechaProduccion,
      productoNombre: lote.productoNombre,
      costoInsumos,
      costoUnitario,
      precioVenta,
      margenUnitario,
      margenPct,
    };
  });
}
