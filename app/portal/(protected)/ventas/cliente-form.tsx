"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { crearCliente } from "./actions";

type ActionResult = { error?: string } | undefined;

export function ClienteForm() {
  const [state, formAction] = useFormState<ActionResult, FormData>(
    crearCliente,
    undefined
  );

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-lg border p-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="nombre-cliente">Nombre</Label>
        <Input id="nombre-cliente" name="nombre" placeholder="Ej. Fernanda Ruiz" required />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="contacto-cliente">Contacto (opcional)</Label>
        <Input
          id="contacto-cliente"
          name="contacto"
          placeholder="Teléfono, Instagram, etc."
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notas-cliente">Notas</Label>
        <Textarea id="notas-cliente" name="notas" />
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
      {pending ? "Guardando…" : "Agregar cliente"}
    </Button>
  );
}
