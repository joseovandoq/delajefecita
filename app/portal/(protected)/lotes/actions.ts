"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { requireSocio } from "@/lib/auth";
import { db } from "@/lib/db";
import { lotes, insumos, movimientosInsumo, recetaInsumos } from "@/lib/db/schema";

const loteSchema = z.object({
  productoId: z.string().uuid("Elige un producto"),
  cantidad: z.coerce.number().positive("La cantidad debe ser mayor a 0"),
  unidad: z.string().min(1).default("frascos"),
  numeroRecetas: z.coerce.number().nonnegative().optional(),
  fechaProduccion: z.string().min(1, "Falta la fecha de producción"),
  fechaCaducidad: z.string().min(1, "Falta la fecha de caducidad"),
  ubicacionId: z.string().uuid().optional().or(z.literal("")),
  notas: z.string().optional(),
});

function parseFormData(formData: FormData) {
  return loteSchema.safeParse({
    productoId: formData.get("productoId"),
    cantidad: formData.get("cantidad"),
    unidad: formData.get("unidad") || "frascos",
    numeroRecetas: formData.get("numeroRecetas") || undefined,
    fechaProduccion: formData.get("fechaProduccion"),
    fechaCaducidad: formData.get("fechaCaducidad"),
    ubicacionId: formData.get("ubicacionId") || "",
    notas: formData.get("notas") || "",
  });
}

const consumoRowSchema = z.object({
  insumoId: z.string().uuid(),
  cantidad: z.coerce.number().positive(),
});

type ConsumoFila = { insumoId: string; cantidad: number; origen: "receta" | "manual" };

function parseConsumo(formData: FormData): { error?: string; consumo: ConsumoFila[] } {
  const insumoIds = formData.getAll("insumoId");
  const cantidades = formData.getAll("cantidadInsumo");

  const filas = insumoIds
    .map((insumoId, i) => ({ insumoId, cantidad: cantidades[i] }))
    .filter((fila) => fila.insumoId);

  const consumo: ConsumoFila[] = [];
  for (const fila of filas) {
    const parsed = consumoRowSchema.safeParse(fila);
    if (!parsed.success) {
      return { error: "Insumo o cantidad inválida en la lista de consumo", consumo: [] };
    }
    consumo.push({ ...parsed.data, origen: "manual" });
  }
  return { consumo };
}

/**
 * Calcula el consumo automatico de insumos a partir de la receta del
 * producto x el numero de recetas capturado. Se recalcula siempre
 * desde la base de datos (no desde lo que mande el cliente) para que
 * la proporcion entre insumos sea siempre la que dice la receta actual.
 */
async function calcularConsumoDeReceta(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  productoId: string,
  numeroRecetas: number | undefined
): Promise<ConsumoFila[]> {
  if (!numeroRecetas || numeroRecetas <= 0) return [];

  const filasReceta = await tx
    .select({
      insumoId: recetaInsumos.insumoId,
      cantidadPorReceta: recetaInsumos.cantidadPorReceta,
    })
    .from(recetaInsumos)
    .where(eq(recetaInsumos.productoId, productoId));

  return filasReceta
    .map((fila) => ({
      insumoId: fila.insumoId,
      cantidad: numeroRecetas * Number(fila.cantidadPorReceta),
      origen: "receta" as const,
    }))
    .filter((fila) => fila.cantidad > 0);
}

type ActionResult = { error?: string } | undefined;

/**
 * Revierte el consumo de insumos previamente registrado para un lote
 * (le regresa la cantidad al stock) y borra esos movimientos. Se usa
 * antes de aplicar el consumo nuevo al editar, y antes de borrar el
 * lote.
 */
async function revertirConsumoDeLote(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  loteId: string
) {
  const previos = await tx
    .select({ insumoId: movimientosInsumo.insumoId, cantidad: movimientosInsumo.cantidad })
    .from(movimientosInsumo)
    .where(and(eq(movimientosInsumo.loteId, loteId), eq(movimientosInsumo.tipo, "salida")));

  for (const previo of previos) {
    await tx
      .update(insumos)
      .set({ stockActual: sql`${insumos.stockActual} + ${previo.cantidad}` })
      .where(eq(insumos.id, previo.insumoId));
  }

  await tx
    .delete(movimientosInsumo)
    .where(and(eq(movimientosInsumo.loteId, loteId), eq(movimientosInsumo.tipo, "salida")));
}

/**
 * Descuenta del stock cada insumo consumido y deja el movimiento de
 * salida registrado, ligado al lote. Lanza si algun insumo no alcanza
 * -- se llama dentro de una transaccion para que todo se revierta junto.
 */
async function aplicarConsumoALote(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  loteId: string,
  consumo: ConsumoFila[],
  fecha: string,
  responsableId: string
) {
  for (const fila of consumo) {
    const [insumo] = await tx
      .select({
        nombre: insumos.nombre,
        stockActual: insumos.stockActual,
        costoUnitario: insumos.costoUnitario,
      })
      .from(insumos)
      .where(eq(insumos.id, fila.insumoId))
      .limit(1);

    if (!insumo) {
      throw new Error("Uno de los insumos seleccionados ya no existe");
    }
    if (Number(insumo.stockActual) < fila.cantidad) {
      throw new Error(`No hay suficiente stock de "${insumo.nombre}"`);
    }

    await tx.insert(movimientosInsumo).values({
      insumoId: fila.insumoId,
      tipo: "salida",
      cantidad: fila.cantidad.toString(),
      costoUnitario: insumo.costoUnitario,
      loteId,
      origen: fila.origen,
      responsableId,
      fecha,
    });

    await tx
      .update(insumos)
      .set({
        stockActual: sql`${insumos.stockActual} - ${fila.cantidad}`,
        updatedAt: new Date(),
      })
      .where(eq(insumos.id, fila.insumoId));
  }
}

export async function crearLote(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const socio = await requireSocio();
  const parsed = parseFormData(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const consumoParsed = parseConsumo(formData);
  if (consumoParsed.error) {
    return { error: consumoParsed.error };
  }

  const data = parsed.data;

  try {
    await db.transaction(async (tx) => {
      const [lote] = await tx
        .insert(lotes)
        .values({
          productoId: data.productoId,
          cantidad: data.cantidad.toString(),
          cantidadDisponible: data.cantidad.toString(),
          unidad: data.unidad,
          numeroRecetas: data.numeroRecetas?.toString() ?? null,
          fechaProduccion: data.fechaProduccion,
          fechaCaducidad: data.fechaCaducidad,
          ubicacionId: data.ubicacionId || null,
          responsableId: socio.id,
          notas: data.notas || null,
        })
        .returning({ id: lotes.id });

      const consumoReceta = await calcularConsumoDeReceta(
        tx,
        data.productoId,
        data.numeroRecetas
      );

      await aplicarConsumoALote(
        tx,
        lote.id,
        [...consumoReceta, ...consumoParsed.consumo],
        data.fechaProduccion,
        socio.id
      );
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No se pudo guardar el lote" };
  }

  revalidatePath("/portal/lotes");
  revalidatePath("/portal/insumos");
  redirect("/portal/lotes");
}

export async function actualizarLote(
  id: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const socio = await requireSocio();
  const parsed = parseFormData(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const consumoParsed = parseConsumo(formData);
  if (consumoParsed.error) {
    return { error: consumoParsed.error };
  }

  const data = parsed.data;

  try {
    await db.transaction(async (tx) => {
      const [loteActual] = await tx
        .select({ cantidad: lotes.cantidad, cantidadDisponible: lotes.cantidadDisponible })
        .from(lotes)
        .where(eq(lotes.id, id))
        .limit(1);

      if (!loteActual) {
        throw new Error("Lote no encontrado");
      }

      // Si ya se vendió/entregó parte de este lote, cambiar la
      // cantidad producida solo mueve la disponible por la diferencia
      // -- no se puede bajar la cantidad por debajo de lo ya vendido.
      const delta = data.cantidad - Number(loteActual.cantidad);
      const nuevaDisponible = Number(loteActual.cantidadDisponible) + delta;
      if (nuevaDisponible < 0) {
        throw new Error(
          "No se puede bajar la cantidad del lote por debajo de lo que ya se vendió o entregó"
        );
      }

      await tx
        .update(lotes)
        .set({
          productoId: data.productoId,
          cantidad: data.cantidad.toString(),
          cantidadDisponible: nuevaDisponible.toString(),
          unidad: data.unidad,
          numeroRecetas: data.numeroRecetas?.toString() ?? null,
          fechaProduccion: data.fechaProduccion,
          fechaCaducidad: data.fechaCaducidad,
          ubicacionId: data.ubicacionId || null,
          notas: data.notas || null,
          updatedAt: new Date(),
        })
        .where(eq(lotes.id, id));

      const consumoReceta = await calcularConsumoDeReceta(
        tx,
        data.productoId,
        data.numeroRecetas
      );

      await revertirConsumoDeLote(tx, id);
      await aplicarConsumoALote(
        tx,
        id,
        [...consumoReceta, ...consumoParsed.consumo],
        data.fechaProduccion,
        socio.id
      );
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No se pudo guardar el lote" };
  }

  revalidatePath("/portal/lotes");
  revalidatePath("/portal/insumos");
  redirect("/portal/lotes");
}

export async function borrarLote(id: string) {
  await requireSocio();
  await db.transaction(async (tx) => {
    await revertirConsumoDeLote(tx, id);
    await tx.delete(lotes).where(eq(lotes.id, id));
  });
  revalidatePath("/portal/lotes");
  revalidatePath("/portal/insumos");
}

const recetaInsumoSchema = z.object({
  productoId: z.string().uuid("Elige un producto"),
  insumoId: z.string().uuid("Elige un insumo"),
  cantidadPorReceta: z.coerce.number().positive("La cantidad debe ser mayor a 0"),
});

/**
 * Agrega o actualiza la cantidad de un insumo en la receta de un
 * producto. Si ya existe una fila para ese producto+insumo, actualiza
 * la cantidad en vez de duplicarla.
 */
export async function guardarRecetaInsumo(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireSocio();
  const parsed = recetaInsumoSchema.safeParse({
    productoId: formData.get("productoId"),
    insumoId: formData.get("insumoId"),
    cantidadPorReceta: formData.get("cantidadPorReceta"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { productoId, insumoId, cantidadPorReceta } = parsed.data;

  const [existente] = await db
    .select({ id: recetaInsumos.id })
    .from(recetaInsumos)
    .where(and(eq(recetaInsumos.productoId, productoId), eq(recetaInsumos.insumoId, insumoId)))
    .limit(1);

  if (existente) {
    await db
      .update(recetaInsumos)
      .set({ cantidadPorReceta: cantidadPorReceta.toString() })
      .where(eq(recetaInsumos.id, existente.id));
  } else {
    await db.insert(recetaInsumos).values({
      productoId,
      insumoId,
      cantidadPorReceta: cantidadPorReceta.toString(),
    });
  }

  revalidatePath("/portal/lotes/recetas");
  revalidatePath("/portal/lotes/nuevo");
}

export async function borrarRecetaInsumo(id: string) {
  await requireSocio();
  await db.delete(recetaInsumos).where(eq(recetaInsumos.id, id));
  revalidatePath("/portal/lotes/recetas");
  revalidatePath("/portal/lotes/nuevo");
}
