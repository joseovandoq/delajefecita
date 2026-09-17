"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { crearCategoriaReparto } from "./actions";

type ActionResult = { error?: string } | undefined;

export function CategoriaForm() {
  const [state, formAction] = useFormState<ActionResult, FormData>(
    crearCategoriaReparto,
    undefined
  );

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-lg border p-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="nombre">Categoría</Label>
          <Input
            id="nombre"
            name="nombre"
            placeholder="Ej. Producción, Venta, Reinversión…"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="porcentaje">Porcentaje</Label>
          <Input
            id="porcentaje"
            name="porcentaje"
            type="number"
            step="0.01"
            min="0"
            max="100"
            defaultValue="0"
            required
          />
        </div>
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="self-start">
      {pending ? "Guardando…" : "Agregar categoría"}
    </Button>
  );
}
