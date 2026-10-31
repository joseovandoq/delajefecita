"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { requireSocio } from "@/lib/auth";
import { db } from "@/lib/db";
import { lotes, puntosVenta, ventas } from "@/lib/db/schema";

export type VentaRapidaResult = { error?: string; ok?: string } | undefined;

const schema = z.object({
  productoId: z.string().uuid("Elige una salsa"),
  puntoVentaId: z.string().uuid("Elige un punto de venta"),
  eventoId: z.string().uuid().optional().or(z.literal("")),
  cantidad: z.coerce.number().int("La cantidad debe ser entera").positive("La cantidad debe ser mayor a 0"),
  total: z.coerce.number().positive("El total debe ser mayor a 0"),
  metodoPago: z.enum(["efectivo", "transferencia", "terminal"], {
    message: "Elige cómo pagaron",
  }),
});

/**
 * Venta rápida: descuenta del lote más viejo primero (FIFO por fecha de
 * caducidad) y, si no alcanza, sigue con el siguiente. Una sola venta
 * puede quedar repartida en varias filas de `ventas` (una por lote),
 * todas con el mismo precio unitario.
 */
export async function registrarVentaRapida(
  _prev: VentaRapidaResult,
  formData: FormData
): Promise<VentaRapidaResult> {
  const socio = await requireSocio();
  const parsed = schema.safeParse({
    productoId: formData.get("productoId"),
    puntoVentaId: formData.get("puntoVentaId"),
    eventoId: formData.get("eventoId") || "",
    cantidad: formData.get("cantidad"),
    total: formData.get("total"),
    metodoPago: formData.get("metodoPago"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const { productoId, puntoVentaId, eventoId, cantidad, total, metodoPago } = parsed.data;

  const [punto] = await db
    .select({ tipo: puntosVenta.tipo })
    .from(puntosVenta)
    .where(eq(puntosVenta.id, puntoVentaId))
    .limit(1);
  if (!punto) return { error: "Punto de venta no encontrado" };
  if (punto.tipo !== "directa") {
    return { error: "La venta rápida es solo para puntos de venta directos. Usa Ventas para consignación." };
  }

  const precioUnitario = Math.round((total / cantidad) * 100) / 100;
  const fecha = new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });

  try {
    await db.transaction(async (tx) => {
      const disponibles = await tx
        .select({ id: lotes.id, disponible: lotes.cantidadDisponible })
        .from(lotes)
        .where(and(eq(lotes.productoId, productoId), sql`${lotes.cantidadDisponible} > 0`))
        .orderBy(lotes.fechaCaducidad, lotes.fechaProduccion)
        .for("update");

      const existencia = disponibles.reduce((a, l) => a + Number(l.disponible), 0);
      if (existencia < cantidad) {
        throw new Error(`Solo hay ${existencia} en bodega de esa salsa`);
      }

      let faltan = cantidad;
      for (const lote of disponibles) {
        if (faltan <= 0) break;
        const toma = Math.min(faltan, Number(lote.disponible));
        await tx.insert(ventas).values({
          loteId: lote.id,
          puntoVentaId,
          eventoId: eventoId || null,
          cantidad: toma.toString(),
          precioUnitario: precioUnitario.toString(),
          metodoPago,
          fecha,
          responsableId: socio.id,
        });
        await tx
          .update(lotes)
          .set({
            cantidadDisponible: sql`${lotes.cantidadDisponible} - ${toma}`,
            updatedAt: new Date(),
          })
          .where(eq(lotes.id, lote.id));
        faltan -= toma;
      }
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo registrar la venta" };
  }

  revalidatePath("/portal/venta-rapida");
  revalidatePath("/portal/ventas");
  revalidatePath("/portal/lotes");
  revalidatePath("/portal/resumen");
  return { ok: `Venta registrada: ${cantidad} × ${total.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}` };
}
