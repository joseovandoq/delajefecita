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
import { registrarVenta } from "./actions";

type Lote = {
  id: string;
  fechaProduccion: string;
  producto: { nombre: string } | null;
};
type PuntoVenta = { id: string; nombre: string; tipo: string };
type Evento = { id: string; nombre: string; fecha: string };
type Cliente = { id: string; nombre: string };
type ActionResult = { error?: string } | undefined;

export function VentaForm({
  lotes,
  puntosVenta,
  eventos,
  clientes,
  hoy,
}: {
  lotes: Lote[];
  puntosVenta: PuntoVenta[];
  eventos: Evento[];
  clientes: Cliente[];
  hoy: string;
}) {
  const [state, formAction] = useFormState<ActionResult, FormData>(
    registrarVenta,
    undefined
  );

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-lg border p-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="loteId-venta">Lote</Label>
        <Select
          name="loteId"
          items={lotes.map((lote) => ({
            value: lote.id,
            label: `${lote.producto?.nombre ?? "—"} · ${format(new Date(lote.fechaProduccion), "d MMM yyyy", { locale: es })}`,
          }))}
          required
        >
          <SelectTrigger id="loteId-venta">
            <SelectValue placeholder="Elige un lote" />
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
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="puntoVentaId-venta">Punto de venta</Label>
        <Select
          name="puntoVentaId"
          items={puntosVenta.map((p) => ({
            value: p.id,
            label: `${p.nombre} ${p.tipo === "consignacion" ? "(consignación)" : ""}`.trim(),
          }))}
          required
        >
          <SelectTrigger id="puntoVentaId-venta">
            <SelectValue placeholder="¿A quién le vendiste?" />
          </SelectTrigger>
          <SelectContent>
            {puntosVenta.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.nombre} {p.tipo === "consignacion" ? "(consignación)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Si es un punto de consignación, esto solo registra que de lo ya
          entregado, esto se vendió (no vuelve a bajar tu existencia en
          bodega).
        </p>
      </div>

      {clientes.length > 0 && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="clienteId-venta">
            ¿A qué persona/amigo le vendiste? (opcional)
          </Label>
          <Select
            name="clienteId"
            items={clientes.map((cliente) => ({ value: cliente.id, label: cliente.nombre }))}
          >
            <SelectTrigger id="clienteId-venta">
              <SelectValue placeholder="Sin asignar" />
            </SelectTrigger>
            <SelectContent>
              {clientes.map((cliente) => (
                <SelectItem key={cliente.id} value={cliente.id}>
                  {cliente.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Si es alguien nuevo, agrégalo primero en la sección
            &quot;Clientes&quot; de arriba.
          </p>
        </div>
      )}

      {eventos.length > 0 && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="eventoId-venta">¿Fue en un evento? (opcional)</Label>
          <Select
            name="eventoId"
            items={eventos.map((evento) => ({
              value: evento.id,
              label: `${evento.nombre} · ${format(new Date(evento.fecha), "d MMM yyyy", { locale: es })}`,
            }))}
          >
            <SelectTrigger id="eventoId-venta">
              <SelectValue placeholder="Sin ligar a un evento" />
            </SelectTrigger>
            <SelectContent>
              {eventos.map((evento) => (
                <SelectItem key={evento.id} value={evento.id}>
                  {evento.nombre} ·{" "}
                  {format(new Date(evento.fecha), "d MMM yyyy", { locale: es })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="cantidad-venta">Cantidad</Label>
          <Input
            id="cantidad-venta"
            name="cantidad"
            type="number"
            step="0.01"
            min="0"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="precioUnitario-venta">Precio unitario</Label>
          <Input
            id="precioUnitario-venta"
            name="precioUnitario"
            type="number"
            step="0.01"
            min="0"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="fecha-venta">Fecha</Label>
          <Input id="fecha-venta" name="fecha" type="date" defaultValue={hoy} required />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notas-venta">Notas</Label>
        <Textarea id="notas-venta" name="notas" />
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
      {pending ? "Guardando…" : "Registrar venta"}
    </Button>
  );
}
