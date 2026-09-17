import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  puntosVenta,
  entregasConsignacion,
  ventas,
  lotes,
  productos,
  socios,
  eventos,
  clientes,
} from "@/lib/db/schema";

export async function listarPuntosVenta() {
  return db.select().from(puntosVenta).orderBy(puntosVenta.nombre);
}

export async function listarPuntosVentaActivos() {
  return db
    .select()
    .from(puntosVenta)
    .where(eq(puntosVenta.activo, true))
    .orderBy(puntosVenta.nombre);
}

/**
 * Lotes con algo todavía en bodega, para elegir en los formularios de
 * venta/entrega.
 */
export async function listarLotesConStock() {
  return db
    .select({
      id: lotes.id,
      cantidadDisponible: lotes.cantidadDisponible,
      unidad: lotes.unidad,
      fechaProduccion: lotes.fechaProduccion,
      producto: { nombre: productos.nombre },
    })
    .from(lotes)
    .leftJoin(productos, eq(lotes.productoId, productos.id))
    .where(sql`${lotes.cantidadDisponible} > 0`)
    .orderBy(desc(lotes.fechaProduccion));
}

/**
 * Todos los lotes recientes (no solo los que tienen existencia en
 * bodega): una venta de un punto en consignación descuenta de lo ya
 * entregado alla, no de la existencia en bodega.
 */
export async function listarLotesParaVenta() {
  return db
    .select({
      id: lotes.id,
      cantidadDisponible: lotes.cantidadDisponible,
      unidad: lotes.unidad,
      fechaProduccion: lotes.fechaProduccion,
      producto: { nombre: productos.nombre },
    })
    .from(lotes)
    .leftJoin(productos, eq(lotes.productoId, productos.id))
    .orderBy(desc(lotes.fechaProduccion))
    .limit(100);
}

export async function listarEventosParaSelect() {
  return db
    .select({ id: eventos.id, nombre: eventos.nombre, fecha: eventos.fecha })
    .from(eventos)
    .orderBy(desc(eventos.fecha))
    .limit(50);
}

export async function listarClientes() {
  return db.select().from(clientes).orderBy(clientes.nombre);
}

export async function listarClientesActivos() {
  return db
    .select({ id: clientes.id, nombre: clientes.nombre })
    .from(clientes)
    .where(eq(clientes.activo, true))
    .orderBy(clientes.nombre);
}

export async function listarVentas() {
  return db
    .select({
      id: ventas.id,
      cantidad: ventas.cantidad,
      precioUnitario: ventas.precioUnitario,
      fecha: ventas.fecha,
      notas: ventas.notas,
      producto: { nombre: productos.nombre },
      puntoVenta: { nombre: puntosVenta.nombre, tipo: puntosVenta.tipo },
      cliente: { nombre: clientes.nombre },
      responsable: { nombre: socios.nombre },
    })
    .from(ventas)
    .leftJoin(lotes, eq(ventas.loteId, lotes.id))
    .leftJoin(productos, eq(lotes.productoId, productos.id))
    .leftJoin(puntosVenta, eq(ventas.puntoVentaId, puntosVenta.id))
    .leftJoin(clientes, eq(ventas.clienteId, clientes.id))
    .leftJoin(socios, eq(ventas.responsableId, socios.id))
    .orderBy(desc(ventas.fecha), desc(ventas.createdAt));
}

/**
 * Cuánto hay entregado (y no reportado como vendido todavía) por cada
 * punto de venta de consignación + lote. Es lo que hay que revisar
 * cuando vas a cobrar o a reponer.
 */
export async function listarExistenciaEnConsignacion() {
  const entregado = await db
    .select({
      puntoVentaId: entregasConsignacion.puntoVentaId,
      loteId: entregasConsignacion.loteId,
      total: sql<string>`sum(${entregasConsignacion.cantidad})`,
    })
    .from(entregasConsignacion)
    .groupBy(entregasConsignacion.puntoVentaId, entregasConsignacion.loteId);

  const vendido = await db
    .select({
      puntoVentaId: ventas.puntoVentaId,
      loteId: ventas.loteId,
      total: sql<string>`sum(${ventas.cantidad})`,
    })
    .from(ventas)
    .groupBy(ventas.puntoVentaId, ventas.loteId);

  const vendidoMap = new Map(
    vendido.map((v) => [`${v.puntoVentaId}:${v.loteId}`, Number(v.total)])
  );

  const filas = entregado
    .map((e) => {
      const key = `${e.puntoVentaId}:${e.loteId}`;
      const disponible = Number(e.total) - (vendidoMap.get(key) ?? 0);
      return { puntoVentaId: e.puntoVentaId, loteId: e.loteId, disponible };
    })
    .filter((f) => f.disponible > 0);

  if (filas.length === 0) return [];

  const [puntos, lotesInfo] = await Promise.all([
    db.select({ id: puntosVenta.id, nombre: puntosVenta.nombre }).from(puntosVenta),
    db
      .select({
        id: lotes.id,
        unidad: lotes.unidad,
        fechaProduccion: lotes.fechaProduccion,
        producto: { nombre: productos.nombre },
      })
      .from(lotes)
      .leftJoin(productos, eq(lotes.productoId, productos.id)),
  ]);

  const puntoPorId = new Map(puntos.map((p) => [p.id, p.nombre]));
  const lotePorId = new Map(lotesInfo.map((l) => [l.id, l]));

  return filas.map((f) => ({
    puntoVentaNombre: puntoPorId.get(f.puntoVentaId) ?? "—",
    lote: lotePorId.get(f.loteId),
    disponible: f.disponible,
  }));
}

/**
 * Cuánto se le ha entregado a un lote+puntoVenta y cuánto de eso ya se
 * reportó vendido, para validar que no se reporte más de lo entregado.
 */
export async function obtenerDisponibleEnConsignacion(
  loteId: string,
  puntoVentaId: string
) {
  const [entregadoRow] = await db
    .select({ total: sql<string>`coalesce(sum(${entregasConsignacion.cantidad}), 0)` })
    .from(entregasConsignacion)
    .where(
      and(
        eq(entregasConsignacion.loteId, loteId),
        eq(entregasConsignacion.puntoVentaId, puntoVentaId)
      )
    );

  const [vendidoRow] = await db
    .select({ total: sql<string>`coalesce(sum(${ventas.cantidad}), 0)` })
    .from(ventas)
    .where(and(eq(ventas.loteId, loteId), eq(ventas.puntoVentaId, puntoVentaId)));

  return Number(entregadoRow?.total ?? 0) - Number(vendidoRow?.total ?? 0);
}
