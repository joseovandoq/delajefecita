"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { guardarRecetaInsumo } from "../actions";

type Producto = { id: string; nombre: string };
type Insumo = { id: string; nombre: string; unidad: string };
type ActionResult = { error?: string } | undefined;

export function RecetaInsumoForm({
  productos,
  insumos,
}: {
  productos: Producto[];
  insumos: Insumo[];
}) {
  const [state, formAction] = useFormState<ActionResult, FormData>(
    guardarRecetaInsumo,
    undefined
  );
  const [insumoId, setInsumoId] = useState("");
  const unidadSeleccionada = insumos.find((i) => i.id === insumoId)?.unidad;

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-end sm:gap-3"
    >
      <div className="flex flex-1 flex-col gap-2">
        <Label htmlFor="productoId-receta">Producto</Label>
        <Select
          name="productoId"
          items={productos.map((p) => ({ value: p.id, label: p.nombre }))}
          required
        >
          <SelectTrigger id="productoId-receta">
            <SelectValue placeholder="Elige un producto" />
          </SelectTrigger>
          <SelectContent>
            {productos.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <Label htmlFor="insumoId-receta">Insumo</Label>
        <Select
          name="insumoId"
          items={insumos.map((i) => ({ value: i.id, label: `${i.nombre} (${i.unidad})` }))}
          onValueChange={(value) => setInsumoId((value as string) ?? "")}
          required
        >
          <SelectTrigger id="insumoId-receta">
            <SelectValue placeholder="Elige un insumo" />
          </SelectTrigger>
          <SelectContent>
            {insumos.map((i) => (
              <SelectItem key={i.id} value={i.id}>
                {i.nombre} ({i.unidad})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="cantidadPorReceta">
          Cantidad por receta{unidadSeleccionada ? ` (${unidadSeleccionada})` : ""}
        </Label>
        <Input
          id="cantidadPorReceta"
          name="cantidadPorReceta"
          type="number"
          step="0.0001"
          min="0"
          placeholder="Ej. 1"
          required
          className="w-32"
        />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando…" : "Guardar"}
    </Button>
  );
}
