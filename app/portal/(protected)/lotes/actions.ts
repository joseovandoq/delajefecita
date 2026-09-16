"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireSocio } from "@/lib/auth";
import { db } from "@/lib/db";
import { lotes } from "@/lib/db/schema";

const loteSchema = z.object({
  productoId: z.string().uuid("Elige un producto"),
  cantidad: z.coerce.number().positive("La cantidad debe ser mayor a 0"),
  unidad: z.string().min(1).default("frascos"),
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
    fechaProduccion: formData.get("fechaProduccion"),
    fechaCaducidad: formData.get("fechaCaducidad"),
    ubicacionId: formData.get("ubicacionId") || "",
    notas: formData.get("notas") || "",
  });
}

type ActionResult = { error?: string } | undefined;

export async function crearLote(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const socio = await requireSocio();
  const parsed = parseFormData(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const data = parsed.data;

  await db.insert(lotes).values({
    productoId: data.productoId,
    cantidad: data.cantidad.toString(),
    unidad: data.unidad,
    fechaProduccion: data.fechaProduccion,
    fechaCaducidad: data.fechaCaducidad,
    ubicacionId: data.ubicacionId || null,
    responsableId: socio.id,
    notas: data.notas || null,
  });

  revalidatePath("/portal/lotes");
  redirect("/portal/lotes");
}

export async function actualizarLote(
  id: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireSocio();
  const parsed = parseFormData(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const data = parsed.data;

  await db
    .update(lotes)
    .set({
      productoId: data.productoId,
      cantidad: data.cantidad.toString(),
      unidad: data.unidad,
      fechaProduccion: data.fechaProduccion,
      fechaCaducidad: data.fechaCaducidad,
      ubicacionId: data.ubicacionId || null,
      notas: data.notas || null,
      updatedAt: new Date(),
    })
    .where(eq(lotes.id, id));

  revalidatePath("/portal/lotes");
  redirect("/portal/lotes");
}

export async function borrarLote(id: string) {
  await requireSocio();
  await db.delete(lotes).where(eq(lotes.id, id));
  revalidatePath("/portal/lotes");
}
