import { differenceInCalendarDays } from "date-fns";
import { Badge } from "@/components/ui/badge";

export function EstadoCaducidadBadge({ fechaCaducidad }: { fechaCaducidad: string }) {
  const dias = differenceInCalendarDays(new Date(fechaCaducidad), new Date());

  if (dias < 0) {
    return <Badge variant="destructive">Caducado</Badge>;
  }
  if (dias <= 30) {
    return (
      <Badge className="bg-amber-500 text-white hover:bg-amber-500/90">
        Caduca en {dias} día{dias === 1 ? "" : "s"}
      </Badge>
    );
  }
  return <Badge variant="secondary">Vigente</Badge>;
}
