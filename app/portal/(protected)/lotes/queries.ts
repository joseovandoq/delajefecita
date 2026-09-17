import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  lotes,
  productos,
  ubicaciones,
  insumos,
  movimientosInsumo,
  recetaInsumos,
} from "@/lib/db/schema";

export async function listarLotes() {
  return db
    .select({
      id: lotes.id,
      cantidad: lotes.cantidad,
      cantidadDisponible: lotes.cantidadDisponible,
      unidad: lotes.unidad,
      fechaProduccion: lotes.fechaProduccion,
      fechaCaducidad: lotes.fechaCaducidad,
      notas: lotes.notas,
      producto: { id: productos.id, nombre: productos.nombre },
      ubicacion: { id: ubicaciones.id, nombre: ubicaciones.nombre },
    })
    .from(lotes)
    .leftJoin(productos, eq(lotes.productoId, productos.id))
    .leftJoin(ubicaciones, eq(lotes.ubicacionId, ubicaciones.id))
    .orderBy(desc(lotes.fechaProduccion));
}

export async function obtenerLote(id: string) {
  const [lote] = await db.select().from(lotes).where(eq(lotes.id, id)).limit(1);
  return lote;
}

export async function listarProductosActivos() {
  return db
    .select()
    .from(productos)
    .where(eq(productos.activo, true))
    .orderBy(productos.nombre);
}

export async function listarUbicaciones() {
  return db.select().from(ubicaciones).orderBy(ubicaciones.nombre);
}

/**
 * Solo ingredientes (lo que va dentro de la salsa): el empaque
 * (frascos, etiquetas) no se consume al mismo tiempo que se registra
 * el lote, se descuenta a mano desde la pantalla del insumo cuando de
 * verdad se embotella.
 */
export async function listarInsumosActivos() {
  return db
    .select({ id: insumos.id, nombre: insumos.nombre, unidad: insumos.unidad })
    .from(insumos)
    .where(and(eq(insumos.activo, true), eq(insumos.categoria, "ingrediente")))
    .orderBy(insumos.nombre);
}

/**
 * Solo el consumo capturado a mano (extra, fuera de receta). El
 * consumo que viene de la receta no se precarga aqui: se recalcula
 * solo a partir de producto + numeroRecetas cada vez que se guarda.
 */
export async function listarConsumoDeLote(loteId: string) {
  return db
    .select({
      insumoId: movimientosInsumo.insumoId,
      cantidad: movimientosInsumo.cantidad,
    })
    .from(movimientosInsumo)
    .where(
      and(eq(movimientosInsumo.loteId, loteId), eq(movimientosInsumo.origen, "manual"))
    );
}

/**
 * Receta de cada producto (cuanto de cada insumo lleva 1 receta
 * completa), agrupada por producto. Se usa en el formulario de lote
 * para mostrar en vivo cuanto se va a descontar segun el numero de
 * recetas capturado.
 */
export async function listarRecetaPorProducto() {
  const filas = await db
    .select({
      productoId: recetaInsumos.productoId,
      insumoId: recetaInsumos.insumoId,
      cantidadPorReceta: recetaInsumos.cantidadPorReceta,
      insumoNombre: insumos.nombre,
      unidad: insumos.unidad,
    })
    .from(recetaInsumos)
    .leftJoin(insumos, eq(recetaInsumos.insumoId, insumos.id));

  const porProducto: Record<
    string,
    { insumoId: string; insumoNombre: string; unidad: string; cantidadPorReceta: number }[]
  > = {};

  for (const fila of filas) {
    if (!porProducto[fila.productoId]) porProducto[fila.productoId] = [];
    porProducto[fila.productoId].push({
      insumoId: fila.insumoId,
      insumoNombre: fila.insumoNombre ?? "—",
      unidad: fila.unidad ?? "",
      cantidadPorReceta: Number(fila.cantidadPorReceta),
    });
  }

  return porProducto;
}

/**
 * Receta detallada con nombre de producto, para la pantalla de
 * mantenimiento de recetas.
 */
export async function listarRecetaDetallada() {
  return db
    .select({
      id: recetaInsumos.id,
      productoId: recetaInsumos.productoId,
      productoNombre: productos.nombre,
      insumoId: recetaInsumos.insumoId,
      insumoNombre: insumos.nombre,
      unidad: insumos.unidad,
      cantidadPorReceta: recetaInsumos.cantidadPorReceta,
    })
    .from(recetaInsumos)
    .leftJoin(productos, eq(recetaInsumos.productoId, productos.id))
    .leftJoin(insumos, eq(recetaInsumos.insumoId, insumos.id))
    .orderBy(productos.nombre, insumos.nombre);
}
