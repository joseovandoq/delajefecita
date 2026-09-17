/**
 * Catálogo fijo de unidades para insumos. Evita que "kg", "Kg" y
 * "kilogramos" terminen siendo tratados como unidades distintas: el
 * formulario de insumos usa esta lista en vez de un campo de texto libre.
 */
export const UNIDADES_INSUMO = [
  { value: "kg", label: "Kilogramos (kg)" },
  { value: "g", label: "Gramos (g)" },
  { value: "l", label: "Litros (l)" },
  { value: "ml", label: "Mililitros (ml)" },
  { value: "pieza", label: "Piezas" },
  { value: "paquete", label: "Paquetes" },
  { value: "caja", label: "Cajas" },
  { value: "cucharada", label: "Cucharadas" },
  { value: "cucharadita", label: "Cucharaditas" },
  { value: "taza", label: "Tazas" },
] as const;

export type UnidadInsumo = (typeof UNIDADES_INSUMO)[number]["value"];
export const UNIDAD_INSUMO_VALUES = UNIDADES_INSUMO.map((u) => u.value) as [
  UnidadInsumo,
  ...UnidadInsumo[],
];

/**
 * Catálogo fijo de tipos de empaque, solo aplica cuando la categoría del
 * insumo es "empaque". Igual que UNIDADES_INSUMO, evita texto libre
 * inconsistente ("frasco" vs "Frasco" vs "frascos").
 */
export const TIPOS_EMPAQUE = [
  { value: "frasco", label: "Frasco" },
  { value: "tapa", label: "Tapa" },
  { value: "etiqueta", label: "Etiqueta" },
  { value: "caja", label: "Caja" },
  { value: "bolsa", label: "Bolsa" },
  { value: "sello_seguridad", label: "Sello de seguridad" },
  { value: "otro", label: "Otro" },
] as const;

export type TipoEmpaque = (typeof TIPOS_EMPAQUE)[number]["value"];
export const TIPO_EMPAQUE_VALUES = TIPOS_EMPAQUE.map((t) => t.value) as [
  TipoEmpaque,
  ...TipoEmpaque[],
];
