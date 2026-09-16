import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { lotes, productos, ubicaciones } from "@/lib/db/schema";

export async function listarLotes() {
  return db
    .select({
      id: lotes.id,
      cantidad: lotes.cantidad,
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
