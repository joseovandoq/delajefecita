"use client";

import { useState } from "react";
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
import { UNIDADES_INSUMO, TIPOS_EMPAQUE } from "@/lib/constants";

type Proveedor = { id: string; nombre: string };
type Ubicacion = { id: string; nombre: string };

type InsumoFormValues = {
  nombre: string;
  categoria: string;
  tipoEmpaque: string | null;
  unidad: string;
  costoUnitario: string | null;
  proveedorId: string | null;
  ubicacionId: string | null;
  stockMinimo: string | null;
  notas: string | null;
};

type ActionResult = { error?: string } | undefined;

export function InsumoForm({
  proveedores,
  ubicaciones,
  action,
  defaultValues,
  submitLabel,
  mostrarStockInicial,
}: {
  proveedores: Proveedor[];
  ubicaciones: Ubicacion[];
  action: (prevState: ActionResult, formData: FormData) => Promise<ActionResult>;
  defaultValues?: InsumoFormValues;
  submitLabel: string;
  mostrarStockInicial?: boolean;
}) {
  const [state, formAction] = useFormState<ActionResult, FormData>(
    action,
    undefined
  );
  const [categoria, setCategoria] = useState(defaultValues?.categoria ?? "ingrediente");

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="nombre">Nombre</Label>
        <Input
          id="nombre"
          name="nombre"
          defaultValue={defaultValues?.nombre}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="categoria">Categoría</Label>
        <Select
          name="categoria"
          items={[
            { value: "ingrediente", label: "Ingrediente (va en la salsa)" },
            { value: "empaque", label: "Empaque (frascos, etiquetas…)" },
          ]}
          defaultValue={defaultValues?.categoria ?? "ingrediente"}
          onValueChange={(value) => setCategoria(value ?? "ingrediente")}
          required
        >
          <SelectTrigger id="categoria">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ingrediente">Ingrediente (va en la salsa)</SelectItem>
            <SelectItem value="empaque">Empaque (frascos, etiquetas…)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Los ingredientes se descuentan solos al registrar un lote. El
          empaque se descuenta a mano desde aquí, cuando de verdad se usa.
        </p>
      </div>

      {categoria === "empaque" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="tipoEmpaque">Tipo de empaque</Label>
          <Select
            name="tipoEmpaque"
            items={TIPOS_EMPAQUE.map((t) => ({ value: t.value, label: t.label }))}
            defaultValue={defaultValues?.tipoEmpaque ?? undefined}
            required
          >
            <SelectTrigger id="tipoEmpaque">
              <SelectValue placeholder="Elige un tipo" />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_EMPAQUE.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="unidad">Unidad</Label>
          <Select
            name="unidad"
            items={UNIDADES_INSUMO.map((u) => ({ value: u.value, label: u.label }))}
            defaultValue={defaultValues?.unidad ?? "kg"}
            required
          >
            <SelectTrigger id="unidad">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNIDADES_INSUMO.map((u) => (
                <SelectItem key={u.value} value={u.value}>
                  {u.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="costoUnitario">Costo unitario</Label>
          <Input
            id="costoUnitario"
            name="costoUnitario"
            type="number"
            step="0.01"
            min="0"
            defaultValue={defaultValues?.costoUnitario ?? ""}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="proveedorId">Proveedor</Label>
        <Select
          name="proveedorId"
          items={proveedores.map((p) => ({ value: p.id, label: p.nombre }))}
          defaultValue={defaultValues?.proveedorId ?? undefined}
        >
          <SelectTrigger id="proveedorId">
            <SelectValue placeholder="Sin asignar" />
          </SelectTrigger>
          <SelectContent>
            {proveedores.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

      <div className="grid grid-cols-2 gap-4">
        {mostrarStockInicial && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="stockActual">Stock inicial</Label>
            <Input
              id="stockActual"
              name="stockActual"
              type="number"
              step="0.01"
              min="0"
              defaultValue="0"
            />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Label htmlFor="stockMinimo">Stock mínimo (alerta)</Label>
          <Input
            id="stockMinimo"
            name="stockMinimo"
            type="number"
            step="0.01"
            min="0"
            defaultValue={defaultValues?.stockMinimo ?? ""}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notas">Notas</Label>
        <Textarea id="notas" name="notas" defaultValue={defaultValues?.notas ?? ""} />
      </div>

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
