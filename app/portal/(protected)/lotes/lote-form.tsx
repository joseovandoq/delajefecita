"use client";

import { useActionState } from "react";
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

type Producto = { id: string; nombre: string };
type Ubicacion = { id: string; nombre: string };

type LoteFormValues = {
  productoId: string;
  cantidad: string;
  unidad: string;
  fechaProduccion: string;
  fechaCaducidad: string;
  ubicacionId: string | null;
  notas: string | null;
};

type ActionResult = { error?: string } | undefined;

export function LoteForm({
  productos,
  ubicaciones,
  action,
  defaultValues,
  submitLabel,
}: {
  productos: Producto[];
  ubicaciones: Ubicacion[];
  action: (prevState: ActionResult, formData: FormData) => Promise<ActionResult>;
  defaultValues?: LoteFormValues;
  submitLabel: string;
}) {
  const [state, formAction, isPending] = useActionState<ActionResult, FormData>(
    action,
    undefined
  );

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="productoId">Producto</Label>
        <Select name="productoId" defaultValue={defaultValues?.productoId} required>
          <SelectTrigger id="productoId">
            <SelectValue placeholder="Elige un producto" />
          </SelectTrigger>
          <SelectContent>
            {productos.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="cantidad">Cantidad</Label>
          <Input
            id="cantidad"
            name="cantidad"
            type="number"
            step="0.01"
            min="0"
            defaultValue={defaultValues?.cantidad}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="unidad">Unidad</Label>
          <Input
            id="unidad"
            name="unidad"
            defaultValue={defaultValues?.unidad ?? "frascos"}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="fechaProduccion">Fecha de producción</Label>
          <Input
            id="fechaProduccion"
            name="fechaProduccion"
            type="date"
            defaultValue={defaultValues?.fechaProduccion}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="fechaCaducidad">Fecha de caducidad</Label>
          <Input
            id="fechaCaducidad"
            name="fechaCaducidad"
            type="date"
            defaultValue={defaultValues?.fechaCaducidad}
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="ubicacionId">Ubicación</Label>
        <Select name="ubicacionId" defaultValue={defaultValues?.ubicacionId ?? undefined}>
          <SelectTrigger id="ubicacionId">
            <SelectValue placeholder="Sin asignar" />
          </SelectTrigger>
          <SelectContent>
            {ubicaciones.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notas">Notas</Label>
        <Textarea id="notas" name="notas" defaultValue={defaultValues?.notas ?? ""} />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Guardando…" : submitLabel}
      </Button>
    </form>
  );
}
