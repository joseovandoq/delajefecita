"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { crearCostoFijo } from "./actions";

type ActionResult = { error?: string } | undefined;

export function CostoFijoForm({ hoy }: { hoy: string }) {
  const [state, formAction] = useFormState<ActionResult, FormData>(
    crearCostoFijo,
    undefined
  );

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-lg border p-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="concepto">Concepto</Label>
          <Input
            id="concepto"
            name="concepto"
            placeholder="Ej. Renta, gas, luz…"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="monto">Monto</Label>
          <Input
            id="monto"
            name="monto"
            type="number"
            step="0.01"
            min="0"
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="fecha">Fecha</Label>
        <Input id="fecha" name="fecha" type="date" defaultValue={hoy} required />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notas">Notas</Label>
        <Textarea id="notas" name="notas" />
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
      {pending ? "Guardando…" : "Registrar gasto"}
    </Button>
  );
}
