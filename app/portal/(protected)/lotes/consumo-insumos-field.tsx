"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type Insumo = { id: string; nombre: string; unidad: string };
type Fila = { insumoId: string; cantidad: string };

/**
 * Lista repetible de insumo+cantidad. Usa un <select> nativo (no el
 * componente Select de shadcn/base-ui) porque necesitamos varias filas
 * con el mismo `name` y leerlas del lado del servidor con
 * formData.getAll("insumoId") / formData.getAll("cantidadInsumo"),
 * emparejadas por posición.
 */
export function ConsumoInsumosField({
  insumos,
  defaultValue,
  label = "Insumos consumidos (opcional)",
}: {
  insumos: Insumo[];
  defaultValue?: Fila[];
  label?: string;
}) {
  const [filas, setFilas] = useState<Fila[]>(defaultValue ?? []);

  function agregarFila() {
    setFilas((f) => [...f, { insumoId: "", cantidad: "" }]);
  }

  function quitarFila(index: number) {
    setFilas((f) => f.filter((_, i) => i !== index));
  }

  function actualizarFila(index: number, patch: Partial<Fila>) {
    setFilas((f) => f.map((fila, i) => (i === index ? { ...fila, ...patch } : fila)));
  }

  return (
    <div className="flex flex-col gap-3">
      <Label>{label}</Label>

      {filas.map((fila, i) => (
        <div key={i} className="flex items-center gap-2">
          <select
            name="insumoId"
            value={fila.insumoId}
            onChange={(e) => actualizarFila(i, { insumoId: e.target.value })}
            className="h-8 flex-1 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            required
          >
            <option value="">Elige un insumo</option>
            {insumos.map((insumo) => (
              <option key={insumo.id} value={insumo.id}>
                {insumo.nombre} ({insumo.unidad})
              </option>
            ))}
          </select>
          <input
            name="cantidadInsumo"
            type="number"
            step="0.01"
            min="0"
            placeholder="Cantidad"
            value={fila.cantidad}
            onChange={(e) => actualizarFila(i, { cantidad: e.target.value })}
            className="h-8 w-28 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => quitarFila(i)}
          >
            Quitar
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        onClick={agregarFila}
      >
        + Agregar insumo
      </Button>
    </div>
  );
}
