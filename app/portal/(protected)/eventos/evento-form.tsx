"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { crearEvento } from "./actions";

type ActionResult = { error?: string } | undefined;

export function EventoForm({ hoy }: { hoy: string }) {
  const [state, formAction] = useFormState<ActionResult, FormData>(
    crearEvento,
    undefined
  );

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-lg border p-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="nombre">Nombre</Label>
        <Input id="nombre" name="nombre" placeholder="Ej. Bazar navideño" required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="fecha">Fecha</Label>
          <Input id="fecha" name="fecha" type="date" defaultValue={hoy} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="lugar">Lugar</Label>
          <Input id="lugar" name="lugar" placeholder="Ej. Plaza X" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notas">Notas</Label>
        <Textarea id="notas" name="notas" />
      </div>

      <p className="text-xs text-muted-foreground">
        Los costos (inscripción, servicios, gasolina, etc.) se agregan
        después de crear el evento, en su página de detalle.
      </p>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="self-start">
      {pending ? "Guardando…" : "Registrar evento"}
    </Button>
  );
}
