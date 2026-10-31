import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { actualizarPrecioVenta } from "./actions";

export function PrecioVentaForm({
  productoId,
  precioVenta,
  precioMayoreo,
  mayoreoDesde,
}: {
  productoId: string;
  precioVenta: string | null;
  precioMayoreo: string | null;
  mayoreoDesde: number;
}) {
  const actionConId = actualizarPrecioVenta.bind(null, productoId);

  return (
    <form action={actionConId} className="flex flex-wrap items-center gap-2">
      <Input
        name="precioVenta"
        type="number"
        step="0.01"
        min="0"
        defaultValue={precioVenta ?? ""}
        placeholder="Precio"
        aria-label="Precio de venta"
        className="h-8 w-24"
      />
      <span className="text-xs text-muted-foreground">Desde</span>
      <Input
        name="mayoreoDesde"
        type="number"
        step="1"
        min="2"
        defaultValue={mayoreoDesde}
        aria-label="Piezas para precio de volumen"
        className="h-8 w-16"
      />
      <span className="text-xs text-muted-foreground">pzas, c/u</span>
      <Input
        name="precioMayoreo"
        type="number"
        step="0.01"
        min="0"
        defaultValue={precioMayoreo ?? ""}
        placeholder="Sin def."
        aria-label="Precio de volumen"
        className="h-8 w-24"
      />
      <Button type="submit" variant="outline" size="sm">
        Guardar
      </Button>
    </form>
  );
}
