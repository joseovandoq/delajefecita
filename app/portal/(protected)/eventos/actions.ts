"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireSocio } from "@/lib/auth";
import { db } from "@/lib/db";
import { eventos, costosEvento } from "@/lib/db/schema";

type ActionResult = { error?: string } | undefined;

const eventoSchema = z.object({
  nombre: z.string().min(1, "Falta el nombre"),
  fecha: z.string().min(1, "Falta la fecha"),
  lugar: z.string().optional(),
  notas: z.string().optional(),
});

export async function crearEvento(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const socio = await requireSocio();
  const parsed = eventoSchema.safeParse({
    nombre: formData.get("nombre"),
    fecha: formData.get("fecha"),
    lugar: formData.get("lugar") || "",
    notas: formData.get("notas") || "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const data = parsed.data;

  const [evento] = await db
    .insert(eventos)
    .values({
      nombre: data.nombre,
      fecha: data.fecha,
      lugar: data.lugar || null,
      notas: data.notas || null,
      responsableId: socio.id,
    })
    .returning({ id: eventos.id });

  revalidatePath("/portal/eventos");
  redirect(`/portal/eventos/${evento.id}`);
}

export async function borrarEvento(id: string) {
  await requireSocio();
  await db.delete(eventos).where(eq(eventos.id, id));
  revalidatePath("/portal/eventos");
}

const costoEventoSchema = z.object({
  concepto: z.string().min(1, "Falta el concepto"),
  monto: z.coerce.number().positive("El monto debe ser mayor a 0"),
  notas: z.string().optional(),
});

export async function agregarCostoEvento(
  eventoId: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireSocio();
  const parsed = costoEventoSchema.safeParse({
    concepto: formData.get("concepto"),
    monto: formData.get("monto"),
    notas: formData.get("notas") || "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const data = parsed.data;

  await db.insert(costosEvento).values({
    eventoId,
    concepto: data.concepto,
    monto: data.monto.toString(),
    notas: data.notas || null,
  });

  revalidatePath(`/portal/eventos/${eventoId}`);
  revalidatePath("/portal/eventos");
  revalidatePath("/portal/utilidades");
}

export async function borrarCostoEvento(id: string, eventoId: string) {
  await requireSocio();
  await db.delete(costosEvento).where(eq(costosEvento.id, id));
  revalidatePath(`/portal/eventos/${eventoId}`);
  revalidatePath("/portal/eventos");
  revalidatePath("/portal/utilidades");
}
