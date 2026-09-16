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
 * Producción de lotes: cuándo y cuánta salsa se hizo, cuándo caduca
 * y dónde está guardada.
 */
export const lotes = pgTable("lotes", {
  id: uuid("id").defaultRandom().primaryKey(),
  productoId: uuid("producto_id")
    .notNull()
    .references(() => productos.id),
  cantidad: numeric("cantidad", { precision: 10, scale: 2 }).notNull(),
  unidad: text("unidad").notNull().default("frascos"),
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
