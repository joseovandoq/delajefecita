import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CostoFijoForm } from "./costo-fijo-form";
import { BorrarCostoFijoButton } from "./borrar-costo-fijo-button";
import { PrecioVentaForm } from "./precio-venta-form";
import {
  listarCostosFijos,
  listarProductosConPrecio,
  listarCostoPorLote,
} from "./queries";

function formatoMoneda(valor: number) {
  return valor.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
}

export default async function CostosPage() {
  const [costosFijos, productos, costoPorLote] = await Promise.all([
    listarCostosFijos(),
    listarProductosConPrecio(),
    listarCostoPorLote(),
  ]);

  const hoy = format(new Date(), "yyyy-MM-dd");
  const totalCostosFijos = costosFijos.reduce((acc, c) => acc + Number(c.monto), 0);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-semibold">Costos</h1>
        <p className="text-muted-foreground">
          Costo de insumos y margen por lote, precio de venta por salsa, y
          gastos fijos del negocio.
        </p>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold">Precio de venta por producto</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Se usa para calcular el margen contra el costo de insumos de cada
          lote de abajo.
        </p>
        {productos.length === 0 ? (
          <p className="text-muted-foreground">Todavía no hay productos.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Precio de venta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.nombre}</TableCell>
                  <TableCell>
                    <PrecioVentaForm productoId={p.id} precioVenta={p.precioVenta} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold">Costo y margen por lote</h2>
        {costoPorLote.length === 0 ? (
          <p className="text-muted-foreground">Todavía no hay lotes registrados.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Costo insumos</TableHead>
                <TableHead>Costo unitario</TableHead>
                <TableHead>Precio de venta</TableHead>
                <TableHead>Margen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costoPorLote.map((lote) => (
                <TableRow key={lote.id}>
                  <TableCell className="font-medium">
                    {lote.productoNombre ?? "—"}
                  </TableCell>
                  <TableCell>
                    {format(new Date(lote.fechaProduccion), "d MMM yyyy", {
                      locale: es,
                    })}
                  </TableCell>
                  <TableCell>
                    {lote.cantidad} {lote.unidad}
                  </TableCell>
                  <TableCell>{formatoMoneda(lote.costoInsumos)}</TableCell>
                  <TableCell>{formatoMoneda(lote.costoUnitario)}</TableCell>
                  <TableCell>
                    {lote.precioVenta !== null ? formatoMoneda(lote.precioVenta) : "—"}
                  </TableCell>
                  <TableCell>
                    {lote.margenPct === null ? (
                      <span className="text-muted-foreground">
                        Falta precio de venta
                      </span>
                    ) : lote.margenPct < 0 ? (
                      <Badge variant="destructive">
                        {formatoMoneda(lote.margenUnitario ?? 0)} (
                        {lote.margenPct.toFixed(0)}%)
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        {formatoMoneda(lote.margenUnitario ?? 0)} (
                        {lote.margenPct.toFixed(0)}%)
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-semibold">Costos fijos del negocio</h2>
          <p className="text-sm text-muted-foreground">
            Total registrado: <strong>{formatoMoneda(totalCostosFijos)}</strong>
          </p>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Renta, gas, luz, etc. No se reparten automáticamente entre los
          lotes; son solo referencia de cuánto cuesta operar.
        </p>

        <div className="mb-6 max-w-lg">
          <CostoFijoForm hoy={hoy} />
        </div>

        {costosFijos.length === 0 ? (
          <p className="text-muted-foreground">Todavía no hay gastos registrados.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Notas</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costosFijos.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    {format(new Date(c.fecha), "d MMM yyyy", { locale: es })}
                  </TableCell>
                  <TableCell className="font-medium">{c.concepto}</TableCell>
                  <TableCell>{formatoMoneda(Number(c.monto))}</TableCell>
                  <TableCell>{c.responsable?.nombre ?? "—"}</TableCell>
                  <TableCell className="max-w-xs truncate">{c.notas ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <BorrarCostoFijoButton id={c.id} />
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
