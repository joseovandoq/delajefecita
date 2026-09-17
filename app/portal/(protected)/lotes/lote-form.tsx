"use client";

import { useMemo, useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConsumoInsumosField } from "./consumo-insumos-field";

type Producto = { id: string; nombre: string };
type Ubicacion = { id: string; nombre: string };
type Insumo = { id: string; nombre: string; unidad: string };
type RecetaFila = {
  insumoId: string;
  insumoNombre: string;
  unidad: string;
  cantidadPorReceta: number;
};

type LoteFormValues = {
  productoId: string;
  cantidad: string;
  unidad: string;
  numeroRecetas: string | null;
  fechaProduccion: string;
  fechaCaducidad: string;
  ubicacionId: string | null;
  notas: string | null;
};

type ActionResult = { error?: string } | undefined;

export function LoteForm({
  productos,
  ubicaciones,
  insumos,
  recetas,
  action,
  defaultValues,
  defaultConsumo,
  submitLabel,
}: {
  productos: Producto[];
  ubicaciones: Ubicacion[];
  insumos: Insumo[];
  recetas: Record<string, RecetaFila[]>;
  action: (prevState: ActionResult, formData: FormData) => Promise<ActionResult>;
  defaultValues?: LoteFormValues;
  defaultConsumo?: { insumoId: string; cantidad: string }[];
  submitLabel: string;
}) {
  const [state, formAction] = useFormState<ActionResult, FormData>(
    action,
    undefined
  );

  const [productoId, setProductoId] = useState(defaultValues?.productoId ?? "");
  const [numeroRecetas, setNumeroRecetas] = useState(defaultValues?.numeroRecetas ?? "");

  const recetaDelProducto = recetas[productoId] ?? [];
  const numero = Number(numeroRecetas);

  const previewReceta = useMemo(() => {
    if (!numero || numero <= 0) return [];
    return recetaDelProducto.map((fila) => ({
      ...fila,
      cantidadCalculada: Math.round(fila.cantidadPorReceta * numero * 10000) / 10000,
    }));
  }, [recetaDelProducto, numero]);

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="productoId">Producto</Label>
        <Select
          name="productoId"
          items={productos.map((p) => ({ value: p.id, label: p.nombre }))}
          defaultValue={defaultValues?.productoId}
          onValueChange={(value) => setProductoId(value ?? "")}
          required
        >
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

      <div className="flex flex-col gap-2">
        <Label htmlFor="numeroRecetas">Número de recetas hechas (opcional)</Label>
        <Input
          id="numeroRecetas"
          name="numeroRecetas"
          type="number"
          step="0.0001"
          min="0"
          placeholder="Ej. 0.85 si hiciste la receta a medias"
          value={numeroRecetas}
          onChange={(e) => setNumeroRecetas(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          El consumo de insumos de abajo se calcula solo a partir de esto y
          de la{" "}
          <a href="/portal/lotes/recetas" className="underline" target="_blank">
            receta configurada
          </a>{" "}
          para el producto elegido.
        </p>
      </div>

      {productoId && numero > 0 && (
        <div className="flex flex-col gap-2">
          <Label>Se va a descontar (automático)</Label>
          {previewReceta.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Este producto todavía no tiene receta configurada.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Insumo</TableHead>
                  <TableHead>Cantidad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewReceta.map((fila) => (
                  <TableRow key={fila.insumoId}>
                    <TableCell>{fila.insumoNombre}</TableCell>
                    <TableCell>
                      {fila.cantidadCalculada} {fila.unidad}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

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
        <Select
          name="ubicacionId"
          items={ubicaciones.map((u) => ({ value: u.id, label: u.nombre }))}
          defaultValue={defaultValues?.ubicacionId ?? undefined}
        >
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

      <ConsumoInsumosField
        insumos={insumos}
        defaultValue={defaultConsumo}
        label="Insumos extra, fuera de receta (opcional)"
      />

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <SubmitButton label={submitLabel} />
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando…" : label}
    </Button>
  );
}
