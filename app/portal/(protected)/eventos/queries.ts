import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { eventos, ventas, costosEvento } from "@/lib/db/schema";

export async function listarEventos() {
  const ingresosPorEvento = await db
    .select({
      eventoId: ventas.eventoId,
      ingreso: sql<string>`sum(${ventas.cantidad} * ${ventas.precioUnitario})`,
    })
    .from(ventas)
    .groupBy(ventas.eventoId);

  const ingresoPorEventoId = new Map(
    ingresosPorEvento
      .filter((fila) => fila.eventoId !== null)
      .map((fila) => [fila.eventoId as string, Number(fila.ingreso)])
  );

  const costosPorEvento = await db
    .select({
      eventoId: costosEvento.eventoId,
      total: sql<string>`sum(${costosEvento.monto})`,
    })
    .from(costosEvento)
    .groupBy(costosEvento.eventoId);

  const costoPorEventoId = new Map(
    costosPorEvento.map((fila) => [fila.eventoId, Number(fila.total)])
  );

  const filas = await db.select().from(eventos).orderBy(desc(eventos.fecha));

  return filas.map((evento) => {
    const ingreso = ingresoPorEventoId.get(evento.id) ?? 0;
    const costo = costoPorEventoId.get(evento.id) ?? 0;
    return {
      ...evento,
      costo,
      ingreso,
      margen: ingreso - costo,
    };
  });
}

export async function listarEventosParaSelect() {
  return db
    .select({ id: eventos.id, nombre: eventos.nombre, fecha: eventos.fecha })
    .from(eventos)
    .orderBy(desc(eventos.fecha))
    .limit(50);
}

export async function obtenerEvento(id: string) {
  const [evento] = await db.select().from(eventos).where(eq(eventos.id, id)).limit(1);
  return evento;
}

export async function listarCostosDeEvento(eventoId: string) {
  return db
    .select()
    .from(costosEvento)
    .where(eq(costosEvento.eventoId, eventoId))
    .orderBy(desc(costosEvento.createdAt));
}
