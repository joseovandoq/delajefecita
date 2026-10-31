import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  ventas,
  lotes,
  productos,
  insumos,
  socios,
  costosFijos,
  costosEvento,
  eventos,
  gastos,
  movimientosInsumo,
  categoriasReparto,
} from "@/lib/db/schema";
import { calcularUtilidad } from "../utilidades/queries";

const num = (v: unknown) => Number(v ?? 0);

export async function obtenerResumen() {
  // Todo lo que no depende de otra consulta corre junto (cada viaje a la
  // base cuesta ~70 ms; en serie eran ~18).
  // Maximo 5 consultas simultaneas por etapa: con mas que conexiones en el
  // pool, postgres.js deja las consultas en cola y contra el pooler de
  // Supabase se quedan colgadas.
  const [[ventasTot], [insumosInv], [salsaInv], [comprasInsumos], categorias] =
    await Promise.all([
    db
      .select({ unidades: sql<string>`coalesce(sum(${ventas.cantidad}), 0)` })
      .from(ventas),
    // Inventario de insumos al costo del stock; salsa disponible al precio de venta.
    db
      .select({
        valor: sql<string>`coalesce(sum(${insumos.stockActual} * coalesce(${insumos.costoUnitario}, 0)), 0)`,
      })
      .from(insumos),
    db
      .select({
        unidades: sql<string>`coalesce(sum(${lotes.cantidadDisponible}), 0)`,
        valor: sql<string>`coalesce(sum(${lotes.cantidadDisponible} * coalesce(${productos.precioVenta}, 0)), 0)`,
      })
      .from(lotes)
      .leftJoin(productos, eq(lotes.productoId, productos.id)),
    db
      .select({
        total: sql<string>`coalesce(sum(${movimientosInsumo.cantidad} * coalesce(${movimientosInsumo.costoUnitario}, 0)), 0)`,
      })
      .from(movimientosInsumo)
      .where(eq(movimientosInsumo.tipo, "entrada")),
    db.select().from(categoriasReparto).where(eq(categoriasReparto.activo, true)),
  ]);

  const [producido, vendido, todosSocios, vendidoPorLote, costoPorLote] =
    await Promise.all([
    db
      .select({
        socioId: lotes.responsableId,
        total: sql<string>`sum(${lotes.cantidad})`,
      })
      .from(lotes)
      .groupBy(lotes.responsableId),
    db
      .select({
        socioId: ventas.responsableId,
        total: sql<string>`sum(${ventas.cantidad} * ${ventas.precioUnitario})`,
      })
      .from(ventas)
      .groupBy(ventas.responsableId),
    db
      .select({ id: socios.id, nombre: socios.nombre })
      .from(socios)
      .where(eq(socios.activo, true)),
    db
      .select({
        loteId: ventas.loteId,
        total: sql<string>`sum(${ventas.cantidad})`,
        ingreso: sql<string>`sum(${ventas.cantidad} * ${ventas.precioUnitario})`,
      })
      .from(ventas)
      .groupBy(ventas.loteId),
    db
      .select({
        loteId: movimientosInsumo.loteId,
        costo: sql<string>`sum(${movimientosInsumo.cantidad} * coalesce(${movimientosInsumo.costoUnitario}, 0))`,
      })
      .from(movimientosInsumo)
      .where(eq(movimientosInsumo.tipo, "salida"))
      .groupBy(movimientosInsumo.loteId),
  ]);

  const [lotesRows, [fijos, evs, libres, compras]] = await Promise.all([
    db
      .select({
        id: lotes.id,
        productoId: lotes.productoId,
        producto: productos.nombre,
        fechaProduccion: lotes.fechaProduccion,
        fechaCaducidad: lotes.fechaCaducidad,
        cantidad: lotes.cantidad,
        disponible: lotes.cantidadDisponible,
      })
      .from(lotes)
      .leftJoin(productos, eq(lotes.productoId, productos.id))
      .orderBy(desc(lotes.fechaProduccion)),
    Promise.all([
      db
        .select({ fecha: costosFijos.fecha, concepto: costosFijos.concepto, monto: costosFijos.monto })
        .from(costosFijos),
      db
        .select({
          fecha: eventos.fecha,
          concepto: sql<string>`${eventos.nombre} || ' · ' || ${costosEvento.concepto}`,
          monto: costosEvento.monto,
        })
        .from(costosEvento)
        .leftJoin(eventos, eq(costosEvento.eventoId, eventos.id)),
      db
        .select({ fecha: gastos.fecha, concepto: gastos.concepto, tipo: gastos.tipo, monto: gastos.monto })
        .from(gastos),
      db
        .select({
          fecha: movimientosInsumo.fecha,
          concepto: sql<string>`'Compra: ' || ${insumos.nombre}`,
          monto: sql<string>`${movimientosInsumo.cantidad} * coalesce(${movimientosInsumo.costoUnitario}, 0)`,
        })
        .from(movimientosInsumo)
        .leftJoin(insumos, eq(movimientosInsumo.insumoId, insumos.id))
        .where(eq(movimientosInsumo.tipo, "entrada")),
    ]),
  ]);

  const u = await calcularUtilidad();

  const utilidadPositiva = Math.max(u.utilidad, 0);
  const pct = (base: string) =>
    categorias.filter((c) => c.base === base).reduce((a, c) => a + num(c.porcentaje), 0);
  const fondo = (utilidadPositiva * pct("fondo")) / 100;
  const poolProduccion = (utilidadPositiva * pct("produccion")) / 100;
  const poolVenta = (utilidadPositiva * pct("venta")) / 100;

  // Reparto por socio: lo de "produccion" va proporcional a las unidades
  // que cada socio produjo; lo de "venta", proporcional a lo que vendio.
  const totalProducido = producido.reduce((a, r) => a + num(r.total), 0);
  const totalVendido = vendido.reduce((a, r) => a + num(r.total), 0);

  const porSocio = todosSocios
    .map((s) => {
      const prod = num(producido.find((r) => r.socioId === s.id)?.total);
      const vend = num(vendido.find((r) => r.socioId === s.id)?.total);
      const porProduccion = totalProducido > 0 ? (poolProduccion * prod) / totalProducido : 0;
      const porVenta = totalVendido > 0 ? (poolVenta * vend) / totalVendido : 0;
      return {
        nombre: s.nombre,
        unidadesProducidas: prod,
        ventasHechas: vend,
        porProduccion,
        porVenta,
        total: porProduccion + porVenta,
      };
    })
    .filter((s) => s.total > 0 || s.unidadesProducidas > 0 || s.ventasHechas > 0);

  // Por lote: producidas / bodega / vendidas / en consignacion.
  const detalleLotes = lotesRows.map((l) => {
    const v = vendidoPorLote.find((x) => x.loteId === l.id);
    const vendidas = num(v?.total);
    const costo = num(costoPorLote.find((x) => x.loteId === l.id)?.costo);
    const producidas = num(l.cantidad);
    const disponible = num(l.disponible);
    return {
      ...l,
      producidas,
      disponible,
      vendidas,
      enConsignacion: Math.max(producidas - disponible - vendidas, 0),
      ingreso: num(v?.ingreso),
      costo,
    };
  });

  const porProducto = new Map<
    string,
    {
      nombre: string;
      producidas: number;
      disponibles: number;
      vendidas: number;
      ingreso: number;
      costo: number;
    }
  >();
  for (const l of detalleLotes) {
    const fila = porProducto.get(l.productoId) ?? {
      nombre: l.producto ?? "—",
      producidas: 0,
      disponibles: 0,
      vendidas: 0,
      ingreso: 0,
      costo: 0,
    };
    fila.producidas += l.producidas;
    fila.disponibles += l.disponible;
    fila.vendidas += l.vendidas;
    fila.ingreso += l.ingreso;
    // costo de insumos proporcional a lo vendido del lote
    fila.costo += l.producidas > 0 ? (l.costo * l.vendidas) / l.producidas : 0;
    porProducto.set(l.productoId, fila);
  }

  // Tabla de gastos: todo lo que ha salido de dinero.
  const tablaGastos = [
    ...fijos.map((g) => ({ fecha: String(g.fecha), concepto: g.concepto, tipo: "Producción (fijo)", monto: num(g.monto) })),
    ...evs.map((g) => ({ fecha: String(g.fecha), concepto: g.concepto, tipo: "Variable (evento)", monto: num(g.monto) })),
    ...libres.map((g) => ({
      fecha: String(g.fecha),
      concepto: g.concepto,
      tipo: g.tipo === "produccion" ? "Producción" : "Variable",
      monto: num(g.monto),
    })),
    ...compras.map((g) => ({ fecha: String(g.fecha), concepto: g.concepto, tipo: "Compra de insumos", monto: num(g.monto) })),
  ].sort((a, b) => b.fecha.localeCompare(a.fecha));

  return {
    ...u,
    unidadesVendidas: num(ventasTot?.unidades),
    inventarioInsumos: num(insumosInv?.valor),
    inventarioSalsaUnidades: num(salsaInv?.unidades),
    inventarioSalsaValor: num(salsaInv?.valor),
    comprasInsumos: num(comprasInsumos?.total),
    fondo,
    pctFondo: pct("fondo"),
    porSocio,
    porProducto: [...porProducto.values()],
    detalleLotes,
    tablaGastos,
    totalGastado:
      num(comprasInsumos?.total) +
      u.costosFijosTotal +
      u.gastosProduccion +
      u.gastosVariables +
      u.costosEventosTotal,
  };
}
