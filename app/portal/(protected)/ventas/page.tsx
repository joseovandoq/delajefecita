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
import { PuntoVentaForm } from "./punto-venta-form";
import { BorrarPuntoVentaButton } from "./borrar-punto-venta-button";
import { EntregaForm } from "./entrega-form";
import { VentaForm } from "./venta-form";
import { ClienteForm } from "./cliente-form";
import { BorrarClienteButton } from "./borrar-cliente-button";
import {
  listarPuntosVenta,
  listarLotesConStock,
  listarLotesParaVenta,
  listarVentas,
  listarExistenciaEnConsignacion,
  listarEventosParaSelect,
  listarClientes,
  listarClientesActivos,
} from "./queries";

function formatoMoneda(valor: number) {
  return valor.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export default async function VentasPage() {
  const [
    puntosVenta,
    lotesConStock,
    lotesParaVenta,
    ventas,
    existenciaConsignacion,
    eventos,
    clientes,
    clientesActivos,
  ] = await Promise.all([
    listarPuntosVenta(),
    listarLotesConStock(),
    listarLotesParaVenta(),
    listarVentas(),
    listarExistenciaEnConsignacion(),
    listarEventosParaSelect(),
    listarClientes(),
    listarClientesActivos(),
  ]);

  const puntosVentaConsignacion = puntosVenta.filter(
    (p) => p.tipo === "consignacion" && p.activo
  );
  const totalVentas = ventas.reduce(
    (acc, v) => acc + Number(v.cantidad) * Number(v.precioUnitario),
    0
  );
  const hoy = format(new Date(), "yyyy-MM-dd");

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-semibold">Ventas y puntos de venta</h1>
        <p className="text-muted-foreground">
          A quién le vendes (directo o en consignación) y el registro de
          ventas.
        </p>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold">Puntos de venta</h2>
        <div className="mb-6 max-w-lg">
          <PuntoVentaForm />
        </div>
        {puntosVenta.length === 0 ? (
          <p className="text-muted-foreground">Todavía no hay puntos de venta.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Notas</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {puntosVenta.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.nombre}</TableCell>
                  <TableCell>
                    {p.tipo === "directa" ? (
                      <Badge variant="secondary">Directa</Badge>
                    ) : (
                      <Badge variant="outline">Consignación</Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{p.notas ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <BorrarPuntoVentaButton id={p.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {puntosVentaConsignacion.length > 0 && (
        <div className="max-w-lg">
          <h2 className="mb-4 text-xl font-semibold">Entregar a consignación</h2>
          <EntregaForm
            lotes={lotesConStock}
            puntosVentaConsignacion={puntosVentaConsignacion}
            hoy={hoy}
          />
        </div>
      )}

      <div>
        <h2 className="mb-4 text-xl font-semibold">Clientes</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Personas reales a las que les vendes (amigos, conocidos,
          recurrentes), para poder darles seguimiento después.
        </p>
        <div className="mb-6 max-w-lg">
          <ClienteForm />
        </div>
        {clientes.length === 0 ? (
          <p className="text-muted-foreground">Todavía no hay clientes.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Notas</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nombre}</TableCell>
                  <TableCell>{c.contacto ?? "—"}</TableCell>
                  <TableCell className="max-w-xs truncate">{c.notas ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <BorrarClienteButton id={c.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="max-w-lg">
        <h2 className="mb-4 text-xl font-semibold">Registrar venta</h2>
        <VentaForm
          lotes={lotesParaVenta}
          puntosVenta={puntosVenta}
          eventos={eventos}
          clientes={clientesActivos}
          hoy={hoy}
        />
      </div>

      {existenciaConsignacion.length > 0 && (
        <div>
          <h2 className="mb-4 text-xl font-semibold">Existencia en consignación</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Lo que está entregado y todavía no se ha reportado como vendido.
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Punto de venta</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>Disponible</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {existenciaConsignacion.map((fila, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{fila.puntoVentaNombre}</TableCell>
                  <TableCell>{fila.lote?.producto?.nombre ?? "—"}</TableCell>
                  <TableCell>
                    {fila.lote
                      ? format(new Date(fila.lote.fechaProduccion), "d MMM yyyy", {
                          locale: es,
                        })
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {fila.disponible} {fila.lote?.unidad}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-semibold">Historial de ventas</h2>
          <p className="text-sm text-muted-foreground">
            Total: <strong>{formatoMoneda(totalVentas)}</strong>
          </p>
        </div>
        {ventas.length === 0 ? (
          <p className="text-muted-foreground">Todavía no hay ventas registradas.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Punto de venta</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Precio unitario</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Responsable</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ventas.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    {format(new Date(v.fecha), "d MMM yyyy", { locale: es })}
                  </TableCell>
                  <TableCell className="font-medium">
                    {v.producto?.nombre ?? "—"}
                  </TableCell>
                  <TableCell>
                    {v.puntoVenta?.nombre ?? "—"}{" "}
                    {v.puntoVenta?.tipo === "consignacion" && (
                      <Badge variant="outline">Consignación</Badge>
                    )}
                  </TableCell>
                  <TableCell>{v.cliente?.nombre ?? "—"}</TableCell>
                  <TableCell>{v.cantidad}</TableCell>
                  <TableCell>{formatoMoneda(Number(v.precioUnitario))}</TableCell>
                  <TableCell>
                    {formatoMoneda(Number(v.cantidad) * Number(v.precioUnitario))}
                  </TableCell>
                  <TableCell>{v.responsable?.nombre ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
