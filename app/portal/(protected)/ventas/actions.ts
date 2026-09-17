"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { requireSocio } from "@/lib/auth";
import { db } from "@/lib/db";
import { puntosVenta, lotes, entregasConsignacion, ventas, clientes } from "@/lib/db/schema";
import { obtenerDisponibleEnConsignacion } from "./queries";

type ActionResult = { error?: string } | undefined;

const puntoVentaSchema = z.object({
  nombre: z.string().min(1, "Falta el nombre"),
  tipo: z.enum(["directa", "consignacion"]),
  notas: z.string().optional(),
});

export async function crearPuntoVenta(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireSocio();
  const parsed = puntoVentaSchema.safeParse({
    nombre: formData.get("nombre"),
    tipo: formData.get("tipo"),
    notas: formData.get("notas") || "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const data = parsed.data;

  await db.insert(puntosVenta).values({
    nombre: data.nombre,
    tipo: data.tipo,
    notas: data.notas || null,
  });

  revalidatePath("/portal/ventas");
  redirect("/portal/ventas");
}

export async function borrarPuntoVenta(id: string) {
  await requireSocio();
  await db.delete(puntosVenta).where(eq(puntosVenta.id, id));
  revalidatePath("/portal/ventas");
}

const clienteSchema = z.object({
  nombre: z.string().min(1, "Falta el nombre"),
  contacto: z.string().optional(),
  notas: z.string().optional(),
});

export async function crearCliente(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireSocio();
  const parsed = clienteSchema.safeParse({
    nombre: formData.get("nombre"),
    contacto: formData.get("contacto") || "",
    notas: formData.get("notas") || "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const data = parsed.data;

  await db.insert(clientes).values({
    nombre: data.nombre,
    contacto: data.contacto || null,
    notas: data.notas || null,
  });

  revalidatePath("/portal/ventas");
  redirect("/portal/ventas");
}

export async function borrarCliente(id: string) {
  await requireSocio();
  await db.delete(clientes).where(eq(clientes.id, id));
  revalidatePath("/portal/ventas");
}

const entregaSchema = z.object({
  loteId: z.string().uuid("Elige un lote"),
  puntoVentaId: z.string().uuid("Elige un punto de venta"),
  cantidad: z.coerce.number().positive("La cantidad debe ser mayor a 0"),
  fecha: z.string().min(1, "Falta la fecha"),
  notas: z.string().optional(),
});

export async function registrarEntregaConsignacion(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const socio = await requireSocio();
  const parsed = entregaSchema.safeParse({
    loteId: formData.get("loteId"),
    puntoVentaId: formData.get("puntoVentaId"),
    cantidad: formData.get("cantidad"),
    fecha: formData.get("fecha"),
    notas: formData.get("notas") || "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { loteId, puntoVentaId, cantidad, fecha, notas } = parsed.data;

  const [puntoVenta] = await db
    .select({ tipo: puntosVenta.tipo })
    .from(puntosVenta)
    .where(eq(puntosVenta.id, puntoVentaId))
    .limit(1);

  if (!puntoVenta || puntoVenta.tipo !== "consignacion") {
    return { error: "Ese punto de venta no es de consignación" };
  }

  const [lote] = await db
    .select({ cantidadDisponible: lotes.cantidadDisponible })
    .from(lotes)
    .where(eq(lotes.id, loteId))
    .limit(1);

  if (!lote) {
    return { error: "Lote no encontrado" };
  }
  if (Number(lote.cantidadDisponible) < cantidad) {
    return { error: "No hay suficiente existencia disponible en ese lote" };
  }

  await db.transaction(async (tx) => {
    await tx.insert(entregasConsignacion).values({
      loteId,
      puntoVentaId,
      cantidad: cantidad.toString(),
      fecha,
      notas: notas || null,
      responsableId: socio.id,
    });

    await tx
      .update(lotes)
      .set({
        cantidadDisponible: sql`${lotes.cantidadDisponible} - ${cantidad}`,
        updatedAt: new Date(),
      })
      .where(eq(lotes.id, loteId));
  });

  revalidatePath("/portal/ventas");
  revalidatePath("/portal/lotes");
}

const ventaSchema = z.object({
  loteId: z.string().uuid("Elige un lote"),
  puntoVentaId: z.string().uuid("Elige un punto de venta"),
  eventoId: z.string().uuid().optional().or(z.literal("")),
  clienteId: z.string().uuid().optional().or(z.literal("")),
  cantidad: z.coerce.number().positive("La cantidad debe ser mayor a 0"),
  precioUnitario: z.coerce.number().positive("El precio debe ser mayor a 0"),
  fecha: z.string().min(1, "Falta la fecha"),
  notas: z.string().optional(),
});

export async function registrarVenta(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const socio = await requireSocio();
  const parsed = ventaSchema.safeParse({
    loteId: formData.get("loteId"),
    puntoVentaId: formData.get("puntoVentaId"),
    eventoId: formData.get("eventoId") || "",
    clienteId: formData.get("clienteId") || "",
    cantidad: formData.get("cantidad"),
    precioUnitario: formData.get("precioUnitario"),
    fecha: formData.get("fecha"),
    notas: formData.get("notas") || "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { loteId, puntoVentaId, eventoId, clienteId, cantidad, precioUnitario, fecha, notas } =
    parsed.data;

  const [puntoVenta] = await db
    .select({ tipo: puntosVenta.tipo })
    .from(puntosVenta)
    .where(eq(puntosVenta.id, puntoVentaId))
    .limit(1);

  if (!puntoVenta) {
    return { error: "Punto de venta no encontrado" };
  }

  const esDirecta = puntoVenta.tipo === "directa";

  if (esDirecta) {
    const [lote] = await db
      .select({ cantidadDisponible: lotes.cantidadDisponible })
      .from(lotes)
      .where(eq(lotes.id, loteId))
      .limit(1);

    if (!lote) {
      return { error: "Lote no encontrado" };
    }
    if (Number(lote.cantidadDisponible) < cantidad) {
      return { error: "No hay suficiente existencia disponible en ese lote" };
    }
  } else {
    const disponible = await obtenerDisponibleEnConsignacion(loteId, puntoVentaId);
    if (cantidad > disponible) {
      return {
        error: `Solo hay ${disponible} entregado sin vender de ese lote en ese punto de venta`,
      };
    }
  }

  await db.transaction(async (tx) => {
    await tx.insert(ventas).values({
      loteId,
      puntoVentaId,
      eventoId: eventoId || null,
      clienteId: clienteId || null,
      cantidad: cantidad.toString(),
      precioUnitario: precioUnitario.toString(),
      fecha,
      notas: notas || null,
      responsableId: socio.id,
    });

    if (esDirecta) {
      await tx
        .update(lotes)
        .set({
          cantidadDisponible: sql`${lotes.cantidadDisponible} - ${cantidad}`,
          updatedAt: new Date(),
        })
        .where(eq(lotes.id, loteId));
    }
  });

  revalidatePath("/portal/ventas");
  revalidatePath("/portal/lotes");
  revalidatePath("/portal/eventos");
}
