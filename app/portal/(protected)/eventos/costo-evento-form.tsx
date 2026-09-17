"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { agregarCostoEvento } from "./actions";

type ActionResult = { error?: string } | undefined;

export function CostoEventoForm({ eventoId }: { eventoId: string }) {
  const action = agregarCostoEvento.bind(null, eventoId);
  const [state, formAction] = useFormState<ActionResult, FormData>(action, undefined);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-end sm:gap-3"
    >
      <div className="flex flex-1 flex-col gap-2">
        <Label htmlFor="concepto-costo-evento">Concepto</Label>
        <Input
          id="concepto-costo-evento"
          name="concepto"
          placeholder="Ej. Cuota de inscripción, gasolina, mesa…"
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="monto-costo-evento">Monto</Label>
        <Input
          id="monto-costo-evento"
          name="monto"
          type="number"
          step="0.01"
          min="0"
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
      {pending ? "Guardando…" : "Agregar costo"}
    </Button>
  );
}
