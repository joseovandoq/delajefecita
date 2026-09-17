import { notFound } from "next/navigation";
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
import { InsumoForm } from "../insumo-form";
import { MovimientoForm } from "../movimiento-form";
import { actualizarInsumo, registrarMovimiento } from "../actions";
import {
  obtenerInsumo,
  listarProveedoresActivos,
  listarUbicaciones,
  listarMovimientos,
  listarLotesRecientes,
} from "../queries";

export default async function EditarInsumoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [insumo, proveedores, ubicaciones, movimientos, lotes] = await Promise.all([
    obtenerInsumo(id),
    listarProveedoresActivos(),
    listarUbicaciones(),
    listarMovimientos(id),
    listarLotesRecientes(),
  ]);

  if (!insumo) {
    notFound();
  }

  const actualizarConId = actualizarInsumo.bind(null, id);
  const registrarMovimientoConId = registrarMovimiento.bind(null, id);
  const hoy = format(new Date(), "yyyy-MM-dd");

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="mb-6 text-2xl font-semibold">Editar insumo</h1>
        <InsumoForm
          proveedores={proveedores}
          ubicaciones={ubicaciones}
          action={actualizarConId}
          submitLabel="Guardar cambios"
          defaultValues={{
            nombre: insumo.nombre,
            categoria: insumo.categoria,
            tipoEmpaque: insumo.tipoEmpaque,
            unidad: insumo.unidad,
            costoUnitario: insumo.costoUnitario,
            proveedorId: insumo.proveedorId,
            ubicacionId: insumo.ubicacionId,
            stockMinimo: insumo.stockMinimo,
            notas: insumo.notas,
          }}
        />
      </div>

      <div className="max-w-lg">
        <h2 className="mb-4 text-xl font-semibold">Registrar movimiento</h2>
        <MovimientoForm action={registrarMovimientoConId} hoy={hoy} lotes={lotes} />
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold">Historial de movimientos</h2>
        {movimientos.length === 0 ? (
          <p className="text-muted-foreground">Todavía no hay movimientos.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Lote relacionado</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Notas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movimientos.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    {format(new Date(m.fecha), "d MMM yyyy", { locale: es })}
                  </TableCell>
                  <TableCell>
                    {m.tipo === "entrada" ? (
                      <Badge variant="secondary">Entrada</Badge>
                    ) : (
                      <Badge variant="outline">Salida</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {m.tipo === "salida" ? "-" : "+"}
                    {m.cantidad} {insumo.unidad}
                  </TableCell>
                  <TableCell>{m.loteProducto ?? "—"}</TableCell>
                  <TableCell>{m.responsable?.nombre ?? "—"}</TableCell>
                  <TableCell className="max-w-xs truncate">{m.notas ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
