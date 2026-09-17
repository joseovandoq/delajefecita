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
import {
  listarRecetaDetallada,
  listarProductosActivos,
  listarInsumosActivos,
} from "../queries";
import { RecetaInsumoForm } from "./receta-insumo-form";
import { BorrarRecetaInsumoButton } from "./borrar-receta-insumo-button";

export default async function RecetasPage() {
  const [receta, productos, insumos] = await Promise.all([
    listarRecetaDetallada(),
    listarProductosActivos(),
    listarInsumosActivos(),
  ]);

  const porProducto = new Map<string, typeof receta>();
  for (const fila of receta) {
    const lista = porProducto.get(fila.productoNombre ?? "—") ?? [];
    lista.push(fila);
    porProducto.set(fila.productoNombre ?? "—", lista);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Recetas</h1>
          <p className="text-muted-foreground">
            Cuánto de cada insumo lleva 1 receta completa de cada producto.
            Al registrar un lote, el consumo de insumos se calcula solo a
            partir de esto y del número de recetas que hayas hecho.
          </p>
        </div>
        <Link href="/portal/lotes" className={cn(buttonVariants({ variant: "outline" }))}>
          Volver a lotes
        </Link>
      </div>

      <div className="max-w-2xl">
        <RecetaInsumoForm productos={productos} insumos={insumos} />
      </div>

      {porProducto.size === 0 ? (
        <p className="text-muted-foreground">
          Todavía no hay recetas configuradas. Agrega insumos arriba para
          cada producto.
        </p>
      ) : (
        Array.from(porProducto.entries()).map(([productoNombre, filas]) => (
          <div key={productoNombre}>
            <h2 className="mb-3 text-lg font-semibold">{productoNombre}</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Insumo</TableHead>
                  <TableHead>Cantidad por receta</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filas.map((fila) => (
                  <TableRow key={fila.id}>
                    <TableCell className="font-medium">{fila.insumoNombre}</TableCell>
                    <TableCell>
                      {fila.cantidadPorReceta} {fila.unidad}
                    </TableCell>
                    <TableCell className="text-right">
                      <BorrarRecetaInsumoButton id={fila.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))
      )}
    </div>
  );
}
