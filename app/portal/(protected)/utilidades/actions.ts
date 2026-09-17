"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireSocio } from "@/lib/auth";
import { db } from "@/lib/db";
import { categoriasReparto } from "@/lib/db/schema";

type ActionResult = { error?: string } | undefined;

const categoriaSchema = z.object({
  nombre: z.string().min(1, "Falta el nombre"),
  porcentaje: z.coerce.number().min(0).max(100),
});

export async function crearCategoriaReparto(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireSocio();
  const parsed = categoriaSchema.safeParse({
    nombre: formData.get("nombre"),
    porcentaje: formData.get("porcentaje") || 0,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const data = parsed.data;

  await db.insert(categoriasReparto).values({
    nombre: data.nombre,
    porcentaje: data.porcentaje.toString(),
  });

  revalidatePath("/portal/utilidades");
  redirect("/portal/utilidades");
}

const porcentajeSchema = z.object({
  porcentaje: z.coerce.number().min(0).max(100),
});

export async function actualizarPorcentaje(id: string, formData: FormData) {
  await requireSocio();
  const parsed = porcentajeSchema.safeParse({
    porcentaje: formData.get("porcentaje") || 0,
  });

  if (!parsed.success) {
    return;
  }

  await db
    .update(categoriasReparto)
    .set({ porcentaje: parsed.data.porcentaje.toString() })
    .where(eq(categoriasReparto.id, id));

  revalidatePath("/portal/utilidades");
}

export async function borrarCategoriaReparto(id: string) {
  await requireSocio();
  await db.delete(categoriasReparto).where(eq(categoriasReparto.id, id));
  revalidatePath("/portal/utilidades");
}
