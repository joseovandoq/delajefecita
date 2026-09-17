import Link from "next/link";
import { notFound } from "next/navigation";
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
import { obtenerEvento, listarCostosDeEvento } from "../queries";
import { CostoEventoForm } from "../costo-evento-form";
import { BorrarCostoEventoButton } from "../borrar-costo-evento-button";

function formatoMoneda(valor: number) {
  return valor.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export default async function DetalleEventoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [evento, costos] = await Promise.all([
    obtenerEvento(id),
    listarCostosDeEvento(id),
  ]);

  if (!evento) {
    notFound();
  }

  const total = costos.reduce((acc, c) => acc + Number(c.monto), 0);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{evento.nombre}</h1>
          <p className="text-muted-foreground">
            {format(new Date(evento.fecha), "d MMM yyyy", { locale: es })}
            {evento.lugar ? ` · ${evento.lugar}` : ""}
          </p>
        </div>
        <Link href="/portal/eventos" className={cn(buttonVariants({ variant: "outline" }))}>
          Volver a eventos
        </Link>
      </div>

      <div>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-semibold">Costos</h2>
          <p className="text-sm text-muted-foreground">
            Total: <strong>{formatoMoneda(total)}</strong>
          </p>
        </div>

        <div className="mb-6 max-w-2xl">
          <CostoEventoForm eventoId={evento.id} />
        </div>

        {costos.length === 0 ? (
          <p className="text-muted-foreground">
            Todavía no hay costos registrados para este evento.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Concepto</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costos.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.concepto}</TableCell>
                  <TableCell>{formatoMoneda(Number(c.monto))}</TableCell>
                  <TableCell className="text-right">
                    <BorrarCostoEventoButton id={c.id} eventoId={evento.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
