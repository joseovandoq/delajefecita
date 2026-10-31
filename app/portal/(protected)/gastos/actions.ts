"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireSocio } from "@/lib/auth";
import { db } from "@/lib/db";
import { gastos } from "@/lib/db/schema";

type ActionResult = { error?: string; ok?: boolean } | undefined;

const gastoSchema = z.object({
  tipo: z.enum(["produccion", "variable"]),
  concepto: z.string().trim().min(1, "Falta el concepto"),
  monto: z.coerce.number().positive("El monto debe ser mayor a 0"),
  fecha: z.string().min(1, "Falta la fecha"),
  notas: z.string().optional(),
});

export async function crearGasto(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const socio = await requireSocio();
  const parsed = gastoSchema.safeParse({
    tipo: formData.get("tipo"),
    concepto: formData.get("concepto"),
    monto: formData.get("monto"),
    fecha: formData.get("fecha"),
    notas: formData.get("notas") || "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const d = parsed.data;

  await db.insert(gastos).values({
    tipo: d.tipo,
    concepto: d.concepto,
    monto: d.monto.toString(),
    fecha: d.fecha,
    notas: d.notas || null,
    responsableId: socio.id,
  });

  revalidatePath("/portal/gastos");
  revalidatePath("/portal/resumen");
  return { ok: true };
}

export async function borrarGasto(id: string) {
  await requireSocio();
  await db.delete(gastos).where(eq(gastos.id, id));
  revalidatePath("/portal/gastos");
  revalidatePath("/portal/resumen");
}
