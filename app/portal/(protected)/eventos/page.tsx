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
import { Badge } from "@/components/ui/badge";
import { EventoForm } from "./evento-form";
import { BorrarEventoButton } from "./borrar-evento-button";
import { listarEventos } from "./queries";

function formatoMoneda(valor: number) {
  return valor.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export default async function EventosPage() {
  const eventos = await listarEventos();
  const hoy = format(new Date(), "yyyy-MM-dd");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Eventos</h1>
        <p className="text-muted-foreground">
          Ferias, mercados y bazares: su costo y si valieron la pena según
          las ventas que ligues ahí.
        </p>
      </div>

      <div className="max-w-lg">
        <EventoForm hoy={hoy} />
      </div>

      {eventos.length === 0 ? (
        <p className="text-muted-foreground">Todavía no hay eventos registrados.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Lugar</TableHead>
              <TableHead>Costo</TableHead>
              <TableHead>Ingreso (ventas ligadas)</TableHead>
              <TableHead>¿Valió la pena?</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {eventos.map((evento) => (
              <TableRow key={evento.id}>
                <TableCell>
                  {format(new Date(evento.fecha), "d MMM yyyy", { locale: es })}
                </TableCell>
                <TableCell className="font-medium">{evento.nombre}</TableCell>
                <TableCell>{evento.lugar ?? "—"}</TableCell>
                <TableCell>{formatoMoneda(Number(evento.costo))}</TableCell>
                <TableCell>{formatoMoneda(evento.ingreso)}</TableCell>
                <TableCell>
                  {evento.ingreso === 0 ? (
                    <span className="text-muted-foreground">Sin ventas ligadas</span>
                  ) : evento.margen >= 0 ? (
                    <Badge variant="secondary">+{formatoMoneda(evento.margen)}</Badge>
                  ) : (
                    <Badge variant="destructive">{formatoMoneda(evento.margen)}</Badge>
                  )}
                </TableCell>
                <TableCell className="flex justify-end gap-2 text-right">
                  <Link
                    href={`/portal/eventos/${evento.id}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    Costos
                  </Link>
                  <BorrarEventoButton id={evento.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
