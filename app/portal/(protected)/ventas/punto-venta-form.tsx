"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { crearPuntoVenta } from "./actions";

type ActionResult = { error?: string } | undefined;

export function PuntoVentaForm() {
  const [state, formAction] = useFormState<ActionResult, FormData>(
    crearPuntoVenta,
    undefined
  );

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-lg border p-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="nombre">Nombre</Label>
        <Input id="nombre" name="nombre" placeholder="Ej. Mercado del Valle" required />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="tipo">Tipo</Label>
        <Select
          name="tipo"
          items={[
            { value: "directa", label: "Venta directa (les vendes y cobras ya)" },
            { value: "consignacion", label: "Consignación (dejas producto, cobras lo que se venda)" },
          ]}
          defaultValue="directa"
          required
        >
          <SelectTrigger id="tipo">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="directa">Venta directa (les vendes y cobras ya)</SelectItem>
            <SelectItem value="consignacion">
              Consignación (dejas producto, cobras lo que se venda)
            </SelectItem>
          </SelectContent>
        </Select>
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
      {pending ? "Guardando…" : "Agregar punto de venta"}
    </Button>
  );
}
