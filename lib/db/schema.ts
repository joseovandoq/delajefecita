import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  numeric,
  date,
} from "drizzle-orm/pg-core";

/**
 * Allowlist de acceso al portal. Un socio solo entra si su correo
 * (el mismo con el que hizo login con Google) existe aquí y está activo.
 */
export const socios = pgTable("socios", {
  id: uuid("id").defaultRandom().primaryKey(),
  nombre: text("nombre").notNull(),
  email: text("email").notNull().unique(),
  rol: text("rol").notNull().default("socio"),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Catálogo de productos (salsas). Pensado para crecer sin tocar código:
 * agregar una salsa nueva es una fila, no un deploy.
 */
export const productos = pgTable("productos", {
  id: uuid("id").defaultRandom().primaryKey(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion"),
  // Precio de venta sugerido por unidad (frasco). Se usa en el modulo
  // de costos para calcular margen contra el costo de insumos.
  precioVenta: numeric("precio_venta", { precision: 10, scale: 2 }),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Lugares físicos donde puede vivir un lote (bodega, refrigerador, etc.).
 */
export const ubicaciones = pgTable("ubicaciones", {
  id: uuid("id").defaultRandom().primaryKey(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Proveedores de insumos (HEB, Plastikart, papelería, etc.). Catálogo
 * simple igual que `productos`/`ubicaciones`: agregar uno nuevo es una
 * fila, no un deploy.
 */
export const proveedores = pgTable("proveedores", {
  id: uuid("id").defaultRandom().primaryKey(),
  nombre: text("nombre").notNull(),
  notas: text("notas"),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Catálogo de insumos (materia prima: chiles, frascos, tapas,
 * etiquetas, especias, etc.) con su existencia actual en inventario.
 * `stockActual` se mantiene con los movimientos de `movimientosInsumo`;
 * no se edita a mano salvo un ajuste manual.
 */
export const insumos = pgTable("insumos", {
  id: uuid("id").defaultRandom().primaryKey(),
  nombre: text("nombre").notNull(),
  // "ingrediente" (va dentro de la salsa, se descuenta solo al crear el
  // lote) | "empaque" (frascos, etiquetas... se descuenta a mano cuando
  // de verdad se embotella, no necesariamente junto con el lote).
  categoria: text("categoria").notNull().default("ingrediente"),
  // Solo aplica cuando categoria = "empaque" (frasco, tapa, etiqueta...).
  // Nulo para insumos tipo "ingrediente".
  tipoEmpaque: text("tipo_empaque"),
  unidad: text("unidad").notNull().default("kg"),
  costoUnitario: numeric("costo_unitario", { precision: 10, scale: 2 }),
  proveedorId: uuid("proveedor_id").references(() => proveedores.id),
  ubicacionId: uuid("ubicacion_id").references(() => ubicaciones.id),
  stockActual: numeric("stock_actual", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  stockMinimo: numeric("stock_minimo", { precision: 12, scale: 2 }),
  activo: boolean("activo").notNull().default(true),
  notas: text("notas"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Receta de un producto: cuánto de cada insumo lleva "1 receta"
 * completa (ej. 1 kg de tomatillo, 10 ml de aceite). Al registrar un
 * lote se captura cuántas recetas se hicieron (puede ser fraccionario,
 * ej. 0.85 si se hizo a medias) y el consumo de cada insumo se calcula
 * multiplicando esa cantidad por `cantidadPorReceta`, para que la
 * proporción entre insumos siempre se respete.
 */
export const recetaInsumos = pgTable("receta_insumos", {
  id: uuid("id").defaultRandom().primaryKey(),
  productoId: uuid("producto_id")
    .notNull()
    .references(() => productos.id, { onDelete: "cascade" }),
  insumoId: uuid("insumo_id")
    .notNull()
    .references(() => insumos.id),
  cantidadPorReceta: numeric("cantidad_por_receta", { precision: 12, scale: 4 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Ledger de movimientos de inventario de insumos: entradas (compras) y
 * salidas (consumo en producción, mermas, etc.). `stockActual` en
 * `insumos` es la suma de estos movimientos; se guarda desnormalizado
 * ahi para no recalcular en cada lectura, pero este historial es la
 * fuente de verdad.
 */
export const movimientosInsumo = pgTable("movimientos_insumo", {
  id: uuid("id").defaultRandom().primaryKey(),
  insumoId: uuid("insumo_id")
    .notNull()
    .references(() => insumos.id),
  tipo: text("tipo").notNull(), // "entrada" | "salida"
  cantidad: numeric("cantidad", { precision: 12, scale: 2 }).notNull(),
  // Costo unitario del insumo al momento del movimiento (se copia del
  // insumo al registrar). Queda "congelado" aqui a proposito: si el
  // precio del chile sube despues, no cambia el costo historico de
  // lotes ya hechos.
  costoUnitario: numeric("costo_unitario", { precision: 10, scale: 2 }),
  loteId: uuid("lote_id").references(() => lotes.id, { onDelete: "cascade" }),
  // "receta" cuando la salida se calculo sola a partir de recetaInsumos
  // x numeroRecetas del lote; "manual" cuando se capturo a mano (extra
  // insumo, ajuste, empaque). Sirve para que al editar un lote no se
  // muestre dos veces el mismo consumo (una vez recalculado desde la
  // receta y otra vez precargado como si fuera manual).
  origen: text("origen").notNull().default("manual"),
  responsableId: uuid("responsable_id").references(() => socios.id),
  notas: text("notas"),
  fecha: date("fecha").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Gastos fijos del negocio que no son de un lote en especifico: renta,
 * gas, luz, etc. Se registran por fecha (mes al que corresponden) para
 * poder verlos agrupados por periodo.
 */
export const costosFijos = pgTable("costos_fijos", {
  id: uuid("id").defaultRandom().primaryKey(),
  concepto: text("concepto").notNull(),
  monto: numeric("monto", { precision: 10, scale: 2 }).notNull(),
  fecha: date("fecha").notNull(),
  notas: text("notas"),
  responsableId: uuid("responsable_id").references(() => socios.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Producción de lotes: cuándo y cuánta salsa se hizo, cuándo caduca
 * y dónde está guardada.
 */
export const lotes = pgTable("lotes", {
  id: uuid("id").defaultRandom().primaryKey(),
  productoId: uuid("producto_id")
    .notNull()
    .references(() => productos.id),
  cantidad: numeric("cantidad", { precision: 10, scale: 2 }).notNull(),
  // Cuanto de este lote sigue en bodega: arranca igual a `cantidad` y
  // baja con cada venta directa o entrega a consignacion (ventas.ts /
  // entregasConsignacion). Igual que stockActual en insumos: se
  // mantiene con las tablas de movimientos, no se edita a mano.
  cantidadDisponible: numeric("cantidad_disponible", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  unidad: text("unidad").notNull().default("frascos"),
  // Cuantas recetas completas se hicieron para este lote (puede ser
  // fraccionario, ej. 0.85). Se usa para calcular en automatico el
  // consumo de insumos a partir de recetaInsumos; queda nulo en lotes
  // sin receta definida o registrados antes de que existiera esto.
  numeroRecetas: numeric("numero_recetas", { precision: 10, scale: 4 }),
  fechaProduccion: date("fecha_produccion").notNull(),
  fechaCaducidad: date("fecha_caducidad").notNull(),
  ubicacionId: uuid("ubicacion_id").references(() => ubicaciones.id),
  responsableId: uuid("responsable_id").references(() => socios.id),
  notas: text("notas"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Tiendas, mercados o cualquier lugar donde se vende. "directa": se
 * les vende y se cobra en el momento (mayoreo). "consignacion": se les
 * deja producto (entregasConsignacion) y solo se cobra lo que
 * reportan vendido (ventas), asi que hay que llevar cuenta de cuanto
 * tienen ahi en un momento dado.
 */
export const puntosVenta = pgTable("puntos_venta", {
  id: uuid("id").defaultRandom().primaryKey(),
  nombre: text("nombre").notNull(),
  tipo: text("tipo").notNull().default("directa"), // "directa" | "consignacion"
  notas: text("notas"),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Personas reales a las que se les vende (amigos, conocidos, clientes
 * recurrentes de un mercado, etc.), independientemente del punto de
 * venta/canal. Sirve para marketing: saber quien compra, que tan
 * seguido, y poder contactarlo despues.
 */
export const clientes = pgTable("clientes", {
  id: uuid("id").defaultRandom().primaryKey(),
  nombre: text("nombre").notNull(),
  contacto: text("contacto"), // telefono, redes sociales, etc.
  notas: text("notas"),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Entrega fisica de producto a un punto de venta de consignacion: baja
 * la existencia del lote pero todavia no es un ingreso (no se ha
 * vendido, solo esta fisicamente alla).
 */
export const entregasConsignacion = pgTable("entregas_consignacion", {
  id: uuid("id").defaultRandom().primaryKey(),
  loteId: uuid("lote_id")
    .notNull()
    .references(() => lotes.id),
  puntoVentaId: uuid("punto_venta_id")
    .notNull()
    .references(() => puntosVenta.id),
  cantidad: numeric("cantidad", { precision: 10, scale: 2 }).notNull(),
  fecha: date("fecha").notNull(),
  notas: text("notas"),
  responsableId: uuid("responsable_id").references(() => socios.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Venta real (dinero recibido o por cobrar ya confirmado). En un punto
 * "directa" tambien baja la existencia del lote al mismo tiempo; en
 * uno de "consignacion" NO baja la existencia otra vez (ya bajo cuando
 * se hizo la entrega), solo registra que de lo entregado, esto se
 * vendio.
 */
export const ventas = pgTable("ventas", {
  id: uuid("id").defaultRandom().primaryKey(),
  loteId: uuid("lote_id")
    .notNull()
    .references(() => lotes.id),
  puntoVentaId: uuid("punto_venta_id")
    .notNull()
    .references(() => puntosVenta.id),
  // Opcional: si esta venta paso en una feria/mercado puntual, se liga
  // aqui para poder ver si el evento valio la pena (ingreso vs costo).
  eventoId: uuid("evento_id").references(() => eventos.id),
  // Opcional: a que persona real se le vendio (amigo, cliente
  // recurrente...), sin importar el punto de venta/canal.
  clienteId: uuid("cliente_id").references(() => clientes.id),
  cantidad: numeric("cantidad", { precision: 10, scale: 2 }).notNull(),
  precioUnitario: numeric("precio_unitario", { precision: 10, scale: 2 }).notNull(),
  fecha: date("fecha").notNull(),
  notas: text("notas"),
  responsableId: uuid("responsable_id").references(() => socios.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Aparicion puntual en una feria/mercado/bazar. Su costo se lleva en
 * `costosEvento` (varios rubros: inscripcion, servicios, gasolina...)
 * en vez de un solo campo, para no limitar de antemano que gastos
 * puede tener. Las ventas de ese dia se pueden ligar aqui
 * (ventas.eventoId) para saber si valio la pena ir.
 */
export const eventos = pgTable("eventos", {
  id: uuid("id").defaultRandom().primaryKey(),
  nombre: text("nombre").notNull(),
  fecha: date("fecha").notNull(),
  lugar: text("lugar"),
  notas: text("notas"),
  responsableId: uuid("responsable_id").references(() => socios.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Un rubro de costo de un evento (cuota de inscripcion, renta de
 * mesa/toldo, gasolina, viaticos, etc.). El costo total del evento es
 * la suma de estas filas.
 */
export const costosEvento = pgTable("costos_evento", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventoId: uuid("evento_id")
    .notNull()
    .references(() => eventos.id, { onDelete: "cascade" }),
  concepto: text("concepto").notNull(),
  monto: numeric("monto", { precision: 10, scale: 2 }).notNull(),
  notas: text("notas"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Como se reparte la utilidad del negocio: categorias configurables
 * (no necesariamente por socio -- pueden ser "responsabilidades" como
 * Produccion/Venta/Reinversion) con un porcentaje cada una. Se le da
 * mantenimiento aqui una vez que definan los numeros; mientras tanto
 * puede quedar vacio o con porcentajes en 0.
 */
export const categoriasReparto = pgTable("categorias_reparto", {
  id: uuid("id").defaultRandom().primaryKey(),
  nombre: text("nombre").notNull(),
  porcentaje: numeric("porcentaje", { precision: 5, scale: 2 }).notNull().default("0"),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
