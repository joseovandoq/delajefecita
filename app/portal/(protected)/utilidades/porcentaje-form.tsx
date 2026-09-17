import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { actualizarPorcentaje } from "./actions";

export function PorcentajeForm({
  categoriaId,
  porcentaje,
}: {
  categoriaId: string;
  porcentaje: string;
}) {
  const actionConId = actualizarPorcentaje.bind(null, categoriaId);

  return (
    <form action={actionConId} className="flex items-center gap-2">
      <Input
        name="porcentaje"
        type="number"
        step="0.01"
        min="0"
        max="100"
        defaultValue={porcentaje}
        className="h-8 w-24"
      />
      <span className="text-sm text-muted-foreground">%</span>
      <Button type="submit" variant="outline" size="sm">
        Guardar
      </Button>
    </form>
  );
}
