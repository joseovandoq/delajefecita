import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CategoriaForm } from "./categoria-form";
import { PorcentajeForm } from "./porcentaje-form";
import { BorrarCategoriaButton } from "./borrar-categoria-button";
import { listarCategoriasReparto, calcularUtilidad } from "./queries";

function formatoMoneda(valor: number) {
  return valor.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export default async function UtilidadesPage() {
  const [categorias, resumen] = await Promise.all([
    listarCategoriasReparto(),
    calcularUtilidad(),
  ]);

  const categoriasActivas = categorias.filter((c) => c.activo);
  const sumaPorcentajes = categoriasActivas.reduce(
    (acc, c) => acc + Number(c.porcentaje),
    0
  );

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-semibold">Utilidades y reparto</h1>
        <p className="text-muted-foreground">
          Ganancia del negocio (histórico) y cómo se reparte entre
          categorías.
        </p>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold">Resumen</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Ingreso por ventas</p>
            <p className="text-xl font-semibold">{formatoMoneda(resumen.ingresoTotal)}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Costo de insumos vendidos</p>
            <p className="text-xl font-semibold">
              -{formatoMoneda(resumen.costoInsumosVendidos)}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Costos fijos</p>
            <p className="text-xl font-semibold">
              -{formatoMoneda(resumen.costosFijosTotal)}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Costos de eventos</p>
            <p className="text-xl font-semibold">
              -{formatoMoneda(resumen.costosEventosTotal)}
            </p>
          </div>
          <div className="rounded-lg border p-4 bg-muted/40">
            <p className="text-sm text-muted-foreground">Utilidad</p>
            <p
              className={`text-xl font-semibold ${resumen.utilidad < 0 ? "text-destructive" : ""}`}
            >
              {formatoMoneda(resumen.utilidad)}
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Es un cálculo de todo el histórico (no por mes todavía) y no
          incluye mano de obra.
        </p>
      </div>

      <div>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-semibold">Categorías de reparto</h2>
          {categoriasActivas.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Suma de porcentajes:{" "}
              <strong className={sumaPorcentajes !== 100 ? "text-destructive" : ""}>
                {sumaPorcentajes}%
              </strong>
              {sumaPorcentajes !== 100 && " (debería sumar 100%)"}
            </p>
          )}
        </div>

        <div className="mb-6 max-w-lg">
          <CategoriaForm />
        </div>

        {categorias.length === 0 ? (
          <p className="text-muted-foreground">
            Todavía no hay categorías de reparto configuradas.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoría</TableHead>
                <TableHead>Porcentaje</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categorias.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    {c.nombre} {!c.activo && <Badge variant="outline">Inactiva</Badge>}
                  </TableCell>
                  <TableCell>
                    <PorcentajeForm categoriaId={c.id} porcentaje={c.porcentaje} />
                  </TableCell>
                  <TableCell>
                    {formatoMoneda((resumen.utilidad * Number(c.porcentaje)) / 100)}
                  </TableCell>
                  <TableCell className="text-right">
                    <BorrarCategoriaButton id={c.id} />
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
