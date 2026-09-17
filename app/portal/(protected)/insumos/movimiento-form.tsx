"use client";

import { useFormState, useFormStatus } from "react-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
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

type Lote = { id: string; fechaProduccion: string; producto: { nombre: string } | null };
type ActionResult = { error?: string } | undefined;

export function MovimientoForm({
  action,
  hoy,
  lotes,
}: {
  action: (prevState: ActionResult, formData: FormData) => Promise<ActionResult>;
  hoy: string;
  lotes: Lote[];
}) {
  const [state, formAction] = useFormState<ActionResult, FormData>(
    action,
    undefined
  );

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-lg border p-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="tipo">Tipo</Label>
          <Select
            name="tipo"
            items={[
              { value: "entrada", label: "Entrada (compra)" },
              { value: "salida", label: "Salida (consumo/merma)" },
            ]}
            defaultValue="entrada"
            required
          >
            <SelectTrigger id="tipo">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="entrada">Entrada (compra)</SelectItem>
              <SelectItem value="salida">Salida (consumo/merma)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="cantidad">Cantidad</Label>
          <Input
            id="cantidad"
            name="cantidad"
            type="number"
            step="0.01"
            min="0"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="fecha">Fecha</Label>
          <Input id="fecha" name="fecha" type="date" defaultValue={hoy} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="costoUnitario">Costo unitario pagado (opcional)</Label>
          <Input
            id="costoUnitario"
            name="costoUnitario"
            type="number"
            step="0.01"
            min="0"
            placeholder="Solo si es entrada/compra"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="loteId">¿Para qué lote fue? (opcional)</Label>
        <Select
          name="loteId"
          items={lotes.map((lote) => ({
            value: lote.id,
            label: `${lote.producto?.nombre ?? "—"} · ${format(new Date(lote.fechaProduccion), "d MMM yyyy", { locale: es })}`,
          }))}
        >
          <SelectTrigger id="loteId">
            <SelectValue placeholder="Sin ligar a un lote" />
          </SelectTrigger>
          <SelectContent>
            {lotes.map((lote) => (
              <SelectItem key={lote.id} value={lote.id}>
                {lote.producto?.nombre ?? "—"} ·{" "}
                {format(new Date(lote.fechaProduccion), "d MMM yyyy", { locale: es })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Útil sobre todo para empaque: registras la salida de frascos o
          etiquetas cuando de verdad embotellas, y aquí indicas de qué lote.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notas">Notas</Label>
        <Textarea id="notas" name="notas" placeholder="Ej. compra en HEB, merma por caducidad…" />
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
      {pending ? "Guardando…" : "Registrar movimiento"}
    </Button>
  );
}
