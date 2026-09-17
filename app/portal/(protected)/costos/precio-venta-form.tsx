import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { actualizarPrecioVenta } from "./actions";

export function PrecioVentaForm({
  productoId,
  precioVenta,
}: {
  productoId: string;
  precioVenta: string | null;
}) {
  const actionConId = actualizarPrecioVenta.bind(null, productoId);

  return (
    <form action={actionConId} className="flex items-center gap-2">
      <Input
        name="precioVenta"
        type="number"
        step="0.01"
        min="0"
        defaultValue={precioVenta ?? ""}
        placeholder="Sin definir"
        className="h-8 w-28"
      />
      <Button type="submit" variant="outline" size="sm">
        Guardar
      </Button>
    </form>
  );
}
