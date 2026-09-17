"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireSocio } from "@/lib/auth";
import { db } from "@/lib/db";
import { costosFijos, productos } from "@/lib/db/schema";

type ActionResult = { error?: string } | undefined;

const costoFijoSchema = z.object({
  concepto: z.string().min(1, "Falta el concepto"),
  monto: z.coerce.number().positive("El monto debe ser mayor a 0"),
  fecha: z.string().min(1, "Falta la fecha"),
  notas: z.string().optional(),
});

export async function crearCostoFijo(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const socio = await requireSocio();
  const parsed = costoFijoSchema.safeParse({
    concepto: formData.get("concepto"),
    monto: formData.get("monto"),
    fecha: formData.get("fecha"),
    notas: formData.get("notas") || "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const data = parsed.data;

  await db.insert(costosFijos).values({
    concepto: data.concepto,
    monto: data.monto.toString(),
    fecha: data.fecha,
    notas: data.notas || null,
    responsableId: socio.id,
  });

  revalidatePath("/portal/costos");
  redirect("/portal/costos");
}

export async function borrarCostoFijo(id: string) {
  await requireSocio();
  await db.delete(costosFijos).where(eq(costosFijos.id, id));
  revalidatePath("/portal/costos");
}

const precioVentaSchema = z.object({
  precioVenta: z.coerce.number().nonnegative().optional(),
});

export async function actualizarPrecioVenta(productoId: string, formData: FormData) {
  await requireSocio();
  const parsed = precioVentaSchema.safeParse({
    precioVenta: formData.get("precioVenta") || undefined,
  });

  if (!parsed.success) {
    return;
  }

  await db
    .update(productos)
    .set({ precioVenta: parsed.data.precioVenta?.toString() ?? null })
    .where(eq(productos.id, productoId));

  revalidatePath("/portal/costos");
}
