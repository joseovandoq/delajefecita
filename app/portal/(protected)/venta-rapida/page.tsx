import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { eventos, lotes, productos, puntosVenta } from "@/lib/db/schema";
import { VentaRapidaForm } from "./venta-rapida-form";

export const dynamic = "force-dynamic";

export default async function VentaRapidaPage() {
  const [prods, puntos, evs] = await Promise.all([
    db
      .select({
        id: productos.id,
        nombre: productos.nombre,
        precioVenta: productos.precioVenta,
        precioMayoreo: productos.precioMayoreo,
        mayoreoDesde: productos.mayoreoDesde,
        enBodega: sql<string>`coalesce(sum(${lotes.cantidadDisponible}), 0)`,
      })
      .from(productos)
      .leftJoin(lotes, eq(lotes.productoId, productos.id))
      .where(eq(productos.activo, true))
      .groupBy(productos.id)
      .orderBy(productos.nombre),
    db
      .select({ id: puntosVenta.id, nombre: puntosVenta.nombre })
      .from(puntosVenta)
      .where(sql`${puntosVenta.activo} = true and ${puntosVenta.tipo} = 'directa'`)
      .orderBy(puntosVenta.nombre),
    db
      .select({ id: eventos.id, nombre: eventos.nombre })
      .from(eventos)
      .orderBy(desc(eventos.fecha))
      .limit(10),
  ]);

  const disponibles = prods
    .map((p) => ({
      id: p.id,
      nombre: p.nombre,
      precioVenta: p.precioVenta === null ? null : Number(p.precioVenta),
      precioMayoreo: p.precioMayoreo === null ? null : Number(p.precioMayoreo),
      mayoreoDesde: p.mayoreoDesde,
      enBodega: Number(p.enBodega),
    }))
    .filter((p) => p.enBodega > 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Venta rápida</h1>
        <p className="text-muted-foreground">
          Para eventos y ventas al vuelo. Descuenta solo del lote que caduca primero. Para amigos o
          consignación usa Ventas.
        </p>
      </div>
      {puntos.length === 0 ? (
        <p className="text-muted-foreground">
          Primero crea un punto de venta directo (por ejemplo &quot;Evento&quot;) en Ventas.
        </p>
      ) : (
        <VentaRapidaForm productos={disponibles} puntos={puntos} eventos={evs} />
      )}
    </div>
  );
}
