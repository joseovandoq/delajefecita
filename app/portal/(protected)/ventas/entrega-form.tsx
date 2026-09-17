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
import { registrarEntregaConsignacion } from "./actions";

type Lote = {
  id: string;
  cantidadDisponible: string;
  unidad: string;
  fechaProduccion: string;
  producto: { nombre: string } | null;
};
type PuntoVenta = { id: string; nombre: string };
type ActionResult = { error?: string } | undefined;

export function EntregaForm({
  lotes,
  puntosVentaConsignacion,
  hoy,
}: {
  lotes: Lote[];
  puntosVentaConsignacion: PuntoVenta[];
  hoy: string;
}) {
  const [state, formAction] = useFormState<ActionResult, FormData>(
    registrarEntregaConsignacion,
    undefined
  );

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-lg border p-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="loteId-entrega">Lote</Label>
        <Select
          name="loteId"
          items={lotes.map((lote) => ({
            value: lote.id,
            label: `${lote.producto?.nombre ?? "—"} · ${format(new Date(lote.fechaProduccion), "d MMM yyyy", { locale: es })} · ${lote.cantidadDisponible} ${lote.unidad} disponibles`,
          }))}
          required
        >
          <SelectTrigger id="loteId-entrega">
            <SelectValue placeholder="Elige un lote con existencia" />
          </SelectTrigger>
          <SelectContent>
            {lotes.map((lote) => (
              <SelectItem key={lote.id} value={lote.id}>
                {lote.producto?.nombre ?? "—"} ·{" "}
                {format(new Date(lote.fechaProduccion), "d MMM yyyy", { locale: es })} ·{" "}
                {lote.cantidadDisponible} {lote.unidad} disponibles
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="puntoVentaId-entrega">Punto de venta</Label>
        <Select
          name="puntoVentaId"
          items={puntosVentaConsignacion.map((p) => ({ value: p.id, label: p.nombre }))}
          required
        >
          <SelectTrigger id="puntoVentaId-entrega">
            <SelectValue placeholder="Elige un punto de consignación" />
          </SelectTrigger>
          <SelectContent>
            {puntosVentaConsignacion.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="cantidad-entrega">Cantidad</Label>
          <Input
            id="cantidad-entrega"
            name="cantidad"
            type="number"
            step="0.01"
            min="0"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="fecha-entrega">Fecha</Label>
          <Input id="fecha-entrega" name="fecha" type="date" defaultValue={hoy} required />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notas-entrega">Notas</Label>
        <Textarea id="notas-entrega" name="notas" />
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
      {pending ? "Guardando…" : "Registrar entrega"}
    </Button>
  );
}
