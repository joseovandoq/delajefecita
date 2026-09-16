import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
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
import { EstadoCaducidadBadge } from "@/components/estado-caducidad-badge";
import { listarLotes } from "./queries";
import { BorrarLoteButton } from "./borrar-lote-button";

export default async function LotesPage() {
  const data = await listarLotes();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Lotes de producción</h1>
          <p className="text-muted-foreground">
            Cuándo y cuánta salsa se hizo, caducidad y ubicación.
          </p>
        </div>
        <Link href="/portal/lotes/nuevo" className={cn(buttonVariants())}>
          Registrar lote
        </Link>
      </div>

      {data.length === 0 ? (
        <p className="text-muted-foreground">Todavía no hay lotes registrados.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Producción</TableHead>
              <TableHead>Caducidad</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((lote) => (
              <TableRow key={lote.id}>
                <TableCell className="font-medium">
                  {lote.producto?.nombre ?? "—"}
                </TableCell>
                <TableCell>
                  {lote.cantidad} {lote.unidad}
                </TableCell>
                <TableCell>
                  {format(new Date(lote.fechaProduccion), "d MMM yyyy", { locale: es })}
                </TableCell>
                <TableCell>
                  {format(new Date(lote.fechaCaducidad), "d MMM yyyy", { locale: es })}
                </TableCell>
                <TableCell>{lote.ubicacion?.nombre ?? "Sin asignar"}</TableCell>
                <TableCell>
                  <EstadoCaducidadBadge fechaCaducidad={lote.fechaCaducidad} />
                </TableCell>
                <TableCell className="flex justify-end gap-2 text-right">
                  <Link
                    href={`/portal/lotes/${lote.id}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    Editar
                  </Link>
                  <BorrarLoteButton id={lote.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
