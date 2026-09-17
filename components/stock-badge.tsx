import { Badge } from "@/components/ui/badge";

export function StockBadge({
  stockActual,
  stockMinimo,
  unidad,
}: {
  stockActual: string;
  stockMinimo: string | null;
  unidad: string;
}) {
  const actual = Number(stockActual);
  const minimo = stockMinimo === null ? null : Number(stockMinimo);

  if (actual <= 0) {
    return <Badge variant="destructive">Sin stock</Badge>;
  }
  if (minimo !== null && actual <= minimo) {
    return (
      <Badge className="bg-amber-500 text-white hover:bg-amber-500/90">
        Stock bajo · {actual} {unidad}
      </Badge>
    );
  }
  return (
    <Badge variant="secondary">
      {actual} {unidad}
    </Badge>
  );
}
