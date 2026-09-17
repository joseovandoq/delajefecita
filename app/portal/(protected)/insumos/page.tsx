import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StockBadge } from "@/components/stock-badge";
import { listarInsumos } from "./queries";
import { BorrarInsumoButton } from "./borrar-insumo-button";
import { TIPOS_EMPAQUE } from "@/lib/constants";

const TIPO_EMPAQUE_LABEL = new Map<string, string>(
  TIPOS_EMPAQUE.map((t) => [t.value, t.label])
);

export default async function InsumosPage() {
  const data = await listarInsumos();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Insumos</h1>
          <p className="text-muted-foreground">
            Materia prima y existencias: chiles, frascos, tapas, etiquetas, etc.
          </p>
        </div>
        <Link href="/portal/insumos/nuevo" className={cn(buttonVariants())}>
          Nuevo insumo
        </Link>
      </div>

      {data.length === 0 ? (
        <p className="text-muted-foreground">Todavía no hay insumos registrados.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Costo unitario</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((insumo) => (
              <TableRow key={insumo.id}>
                <TableCell className="font-medium">{insumo.nombre}</TableCell>
                <TableCell>
                  {insumo.categoria === "ingrediente" ? (
                    <Badge variant="secondary">Ingrediente</Badge>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline">Empaque</Badge>
                      {insumo.tipoEmpaque && (
                        <span className="text-xs text-muted-foreground">
                          {TIPO_EMPAQUE_LABEL.get(insumo.tipoEmpaque) ?? insumo.tipoEmpaque}
                        </span>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell>{insumo.proveedor?.nombre ?? "—"}</TableCell>
                <TableCell>{insumo.ubicacion?.nombre ?? "Sin asignar"}</TableCell>
                <TableCell>
                  {insumo.costoUnitario ? `$${insumo.costoUnitario}` : "—"}
                </TableCell>
                <TableCell>
                  <StockBadge
                    stockActual={insumo.stockActual}
                    stockMinimo={insumo.stockMinimo}
                    unidad={insumo.unidad}
                  />
                </TableCell>
                <TableCell className="flex justify-end gap-2 text-right">
                  <Link
                    href={`/portal/insumos/${insumo.id}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    Ver / Editar
                  </Link>
                  <BorrarInsumoButton id={insumo.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
