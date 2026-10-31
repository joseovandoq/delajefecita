"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { crearGasto } from "./actions";

type ActionResult = { error?: string; ok?: boolean } | undefined;

export function GastoForm({ hoy, conceptos }: { hoy: string; conceptos: string[] }) {
  const [state, formAction] = useFormState<ActionResult, FormData>(crearGasto, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-4 rounded-lg border p-4"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="tipo-gasto">Tipo</Label>
          <select
            id="tipo-gasto"
            name="tipo"
            defaultValue="variable"
            className="h-9 rounded-md border bg-background px-3 text-sm"
          >
            <option value="variable">Variable (promo, marketing, web, eventos…)</option>
            <option value="produccion">Producción (gas, luz, agua, empaque…)</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="concepto-gasto">Concepto</Label>
          <Input
            id="concepto-gasto"
            name="concepto"
            list="conceptos-gasto"
            placeholder="Ej. Gorras, dominio de la página…"
            required
          />
          <datalist id="conceptos-gasto">
            {conceptos.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="monto-gasto">Monto</Label>
          <Input id="monto-gasto" name="monto" type="number" step="0.01" min="0" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="fecha-gasto">Fecha</Label>
          <Input id="fecha-gasto" name="fecha" type="date" defaultValue={hoy} required />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="notas-gasto">Notas</Label>
        <Input id="notas-gasto" name="notas" />
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
