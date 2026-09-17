import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { insumos, proveedores, ubicaciones, movimientosInsumo, socios, lotes, productos } from "@/lib/db/schema";

export async function listarInsumos() {
  return db
    .select({
      id: insumos.id,
      nombre: insumos.nombre,
      categoria: insumos.categoria,
      tipoEmpaque: insumos.tipoEmpaque,
      unidad: insumos.unidad,
      costoUnitario: insumos.costoUnitario,
      stockActual: insumos.stockActual,
      stockMinimo: insumos.stockMinimo,
      activo: insumos.activo,
      proveedor: { id: proveedores.id, nombre: proveedores.nombre },
      ubicacion: { id: ubicaciones.id, nombre: ubicaciones.nombre },
    })
    .from(insumos)
    .leftJoin(proveedores, eq(insumos.proveedorId, proveedores.id))
    .leftJoin(ubicaciones, eq(insumos.ubicacionId, ubicaciones.id))
    .orderBy(insumos.nombre);
}

export async function obtenerInsumo(id: string) {
  const [insumo] = await db.select().from(insumos).where(eq(insumos.id, id)).limit(1);
  return insumo;
}

export async function listarProveedoresActivos() {
  return db
    .select()
    .from(proveedores)
    .where(eq(proveedores.activo, true))
    .orderBy(proveedores.nombre);
}

export async function listarUbicaciones() {
  return db.select().from(ubicaciones).orderBy(ubicaciones.nombre);
}

/**
 * Para el selector opcional "¿para qué lote fue?" al registrar una
 * salida de empaque (frascos, etiquetas) que no se gasta junto con el
 * lote sino despues, al embotellar.
 */
export async function listarLotesRecientes() {
  return db
    .select({
      id: lotes.id,
      fechaProduccion: lotes.fechaProduccion,
      producto: { nombre: productos.nombre },
    })
    .from(lotes)
    .leftJoin(productos, eq(lotes.productoId, productos.id))
    .orderBy(desc(lotes.fechaProduccion))
    .limit(50);
}

export async function listarMovimientos(insumoId: string) {
  return db
    .select({
      id: movimientosInsumo.id,
      tipo: movimientosInsumo.tipo,
      cantidad: movimientosInsumo.cantidad,
      fecha: movimientosInsumo.fecha,
      notas: movimientosInsumo.notas,
      createdAt: movimientosInsumo.createdAt,
      responsable: { nombre: socios.nombre },
      loteId: lotes.id,
      loteProducto: productos.nombre,
    })
    .from(movimientosInsumo)
    .leftJoin(socios, eq(movimientosInsumo.responsableId, socios.id))
    .leftJoin(lotes, eq(movimientosInsumo.loteId, lotes.id))
    .leftJoin(productos, eq(lotes.productoId, productos.id))
    .where(eq(movimientosInsumo.insumoId, insumoId))
    .orderBy(desc(movimientosInsumo.fecha), desc(movimientosInsumo.createdAt));
}
