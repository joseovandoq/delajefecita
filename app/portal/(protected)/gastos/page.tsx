import { desc, eq } from "drizzle-orm";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { db } from "@/lib/db";
import { gastos, socios } from "@/lib/db/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GastoForm } from "./gasto-form";
import { BorrarGastoButton } from "./borrar-gasto-button";

export const dynamic = "force-dynamic";

const mxn = (v: number) => v.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

export default async function GastosPage() {
  const filas = await db
    .select({
      id: gastos.id,
      tipo: gastos.tipo,
      concepto: gastos.concepto,
      monto: gastos.monto,
      fecha: gastos.fecha,
      notas: gastos.notas,
      responsable: socios.nombre,
    })
    .from(gastos)
    .leftJoin(socios, eq(gastos.responsableId, socios.id))
    .orderBy(desc(gastos.fecha), desc(gastos.createdAt));

  const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });
  const conceptos = [...new Set(filas.map((f) => f.concepto))];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Gastos</h1>
        <p className="text-muted-foreground">
          Cualquier gasto que no sea compra de insumos: promocionales, marketing, página web, etc.
          Escribe el concepto libremente.
        </p>
      </div>

      <div className="max-w-2xl">
        <GastoForm hoy={hoy} conceptos={conceptos} />
      </div>

      {filas.length === 0 ? (
        <p className="text-muted-foreground">Todavía no hay gastos registrados.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Concepto</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Registró</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filas.map((g) => (
              <TableRow key={g.id}>
                <TableCell>{format(new Date(g.fecha), "d MMM yyyy", { locale: es })}</TableCell>
                <TableCell className="font-medium">
                  {g.concepto}
                  {g.notas && <span className="block text-xs text-muted-foreground">{g.notas}</span>}
                </TableCell>
                <TableCell>{g.tipo === "produccion" ? "Producción" : "Variable"}</TableCell>
                <TableCell>{g.responsable ?? "—"}</TableCell>
                <TableCell className="text-right">{mxn(Number(g.monto))}</TableCell>
                <TableCell className="text-right">
                  <BorrarGastoButton id={g.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
