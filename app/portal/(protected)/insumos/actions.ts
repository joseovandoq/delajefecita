"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { requireSocio } from "@/lib/auth";
import { db } from "@/lib/db";
import { insumos, movimientosInsumo } from "@/lib/db/schema";
import { UNIDAD_INSUMO_VALUES, TIPO_EMPAQUE_VALUES } from "@/lib/constants";

const insumoSchema = z.object({
  nombre: z.string().min(1, "Falta el nombre"),
  categoria: z.enum(["ingrediente", "empaque"]),
  tipoEmpaque: z.enum(TIPO_EMPAQUE_VALUES).optional().or(z.literal("")),
  unidad: z.enum(UNIDAD_INSUMO_VALUES),
  costoUnitario: z.coerce.number().nonnegative().optional(),
  proveedorId: z.string().uuid().optional().or(z.literal("")),
  ubicacionId: z.string().uuid().optional().or(z.literal("")),
  stockActual: z.coerce.number().nonnegative().default(0),
  stockMinimo: z.coerce.number().nonnegative().optional(),
  notas: z.string().optional(),
});

function parseInsumoFormData(formData: FormData) {
  return insumoSchema.safeParse({
    nombre: formData.get("nombre"),
    categoria: formData.get("categoria") || "ingrediente",
    tipoEmpaque: formData.get("tipoEmpaque") || "",
    unidad: formData.get("unidad") || "kg",
    costoUnitario: formData.get("costoUnitario") || undefined,
    proveedorId: formData.get("proveedorId") || "",
    ubicacionId: formData.get("ubicacionId") || "",
    stockActual: formData.get("stockActual") || 0,
    stockMinimo: formData.get("stockMinimo") || undefined,
    notas: formData.get("notas") || "",
  });
}

type ActionResult = { error?: string } | undefined;

export async function crearInsumo(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireSocio();
  const parsed = parseInsumoFormData(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const data = parsed.data;

  await db.insert(insumos).values({
    nombre: data.nombre,
    categoria: data.categoria,
    tipoEmpaque: data.categoria === "empaque" ? data.tipoEmpaque || null : null,
    unidad: data.unidad,
    costoUnitario: data.costoUnitario?.toString() ?? null,
    proveedorId: data.proveedorId || null,
    ubicacionId: data.ubicacionId || null,
    stockActual: data.stockActual.toString(),
    stockMinimo: data.stockMinimo?.toString() ?? null,
    notas: data.notas || null,
  });

  revalidatePath("/portal/insumos");
  redirect("/portal/insumos");
}

export async function actualizarInsumo(
  id: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireSocio();
  const parsed = parseInsumoFormData(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const data = parsed.data;

  await db
    .update(insumos)
    .set({
      nombre: data.nombre,
      categoria: data.categoria,
      tipoEmpaque: data.categoria === "empaque" ? data.tipoEmpaque || null : null,
      unidad: data.unidad,
      costoUnitario: data.costoUnitario?.toString() ?? null,
      proveedorId: data.proveedorId || null,
      ubicacionId: data.ubicacionId || null,
      stockMinimo: data.stockMinimo?.toString() ?? null,
      notas: data.notas || null,
      updatedAt: new Date(),
    })
    .where(eq(insumos.id, id));

  revalidatePath("/portal/insumos");
  redirect("/portal/insumos");
}

export async function borrarInsumo(id: string) {
  await requireSocio();
  await db.delete(insumos).where(eq(insumos.id, id));
  revalidatePath("/portal/insumos");
}

const movimientoSchema = z.object({
  tipo: z.enum(["entrada", "salida"]),
  cantidad: z.coerce.number().positive("La cantidad debe ser mayor a 0"),
  fecha: z.string().min(1, "Falta la fecha"),
  loteId: z.string().uuid().optional().or(z.literal("")),
  costoUnitario: z.coerce.number().nonnegative().optional(),
  notas: z.string().optional(),
});

export async function registrarMovimiento(
  insumoId: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const socio = await requireSocio();
  const parsed = movimientoSchema.safeParse({
    tipo: formData.get("tipo"),
    cantidad: formData.get("cantidad"),
    fecha: formData.get("fecha"),
    loteId: formData.get("loteId") || "",
    costoUnitario: formData.get("costoUnitario") || undefined,
    notas: formData.get("notas") || "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { tipo, cantidad, fecha, loteId, costoUnitario, notas } = parsed.data;

  const [insumo] = await db
    .select({ stockActual: insumos.stockActual, costoUnitario: insumos.costoUnitario })
    .from(insumos)
    .where(eq(insumos.id, insumoId))
    .limit(1);

  if (!insumo) {
    return { error: "Insumo no encontrado" };
  }

  if (tipo === "salida" && Number(insumo.stockActual) < cantidad) {
    return { error: "No hay suficiente stock para esa salida" };
  }

  // Al vender/consumir se congela el costo actual del insumo. Al
  // comprar, si dan un costo nuevo se usa ese (y se vuelve el costo
  // "actual" del insumo, para futuras estimaciones); si no, se deja el
  // que ya tenía.
  const costoParaMovimiento =
    tipo === "entrada" ? costoUnitario ?? insumo.costoUnitario : insumo.costoUnitario;

  await db.transaction(async (tx) => {
    await tx.insert(movimientosInsumo).values({
      insumoId,
      tipo,
      cantidad: cantidad.toString(),
      fecha,
      loteId: loteId || null,
      costoUnitario:
        costoParaMovimiento === null || costoParaMovimiento === undefined
          ? null
          : costoParaMovimiento.toString(),
      notas: notas || null,
      responsableId: socio.id,
    });

    await tx
      .update(insumos)
      .set({
        stockActual:
          tipo === "entrada"
            ? sql`${insumos.stockActual} + ${cantidad}`
            : sql`${insumos.stockActual} - ${cantidad}`,
        ...(tipo === "entrada" && costoUnitario !== undefined
          ? { costoUnitario: costoUnitario.toString() }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(insumos.id, insumoId));
  });

  revalidatePath(`/portal/insumos/${insumoId}`);
  revalidatePath("/portal/insumos");
  revalidatePath("/portal/costos");
}
