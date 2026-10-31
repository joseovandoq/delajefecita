import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { obtenerResumen } from "./queries";

const mxn = (v: number) => v.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
const fmtFecha = (f: string | Date) => format(new Date(f), "d MMM yyyy", { locale: es });

function Tarjeta({
  titulo,
  valor,
  detalle,
  destacar,
}: {
  titulo: string;
  valor: string;
  detalle?: string;
  destacar?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-4 ${destacar ? "bg-muted/40" : ""}`}>
      <p className="text-sm text-muted-foreground">{titulo}</p>
      <p className="text-xl font-semibold">{valor}</p>
      {detalle && <p className="mt-1 text-xs text-muted-foreground">{detalle}</p>}
    </div>
  );
}

export default async function ResumenPage() {
  const r = await obtenerResumen();

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-semibold">Resumen</h1>
        <p className="text-muted-foreground">Estado de resultados de todo el histórico.</p>
      </div>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Estado de resultados</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Tarjeta
            titulo="Ventas"
            valor={mxn(r.ingresoTotal)}
            detalle={`${r.unidadesVendidas} unidades vendidas`}
          />
          <Tarjeta
            titulo="Costo de producción"
            valor={`-${mxn(r.costoProduccion)}`}
            detalle={`Insumos ${mxn(r.costoInsumosVendidos)} · fijos ${mxn(r.costosFijosTotal)} · otros ${mxn(r.gastosProduccion)}`}
          />
          <Tarjeta
            titulo="Gastos variables"
            valor={`-${mxn(r.gastosVariablesTotal)}`}
            detalle={`Eventos ${mxn(r.costosEventosTotal)} · promo/marketing/web ${mxn(r.gastosVariables)}`}
          />
          <Tarjeta titulo="Utilidad (profit)" valor={mxn(r.utilidad)} destacar />
          <Tarjeta titulo="Inventario de insumos" valor={mxn(r.inventarioInsumos)} detalle="Stock a costo" />
          <Tarjeta
            titulo="Inventario de salsa"
            valor={mxn(r.inventarioSalsaValor)}
            detalle={`${r.inventarioSalsaUnidades} unidades en bodega, a precio de venta`}
          />
          <Tarjeta
            titulo="Fondo de inversión"
            valor={mxn(r.fondo)}
            detalle={`${r.pctFondo}% de la utilidad`}
            destacar
          />
          <Tarjeta
            titulo="Gastado en total"
            valor={mxn(r.totalGastado)}
            detalle="Compras de insumos + todos los gastos"
          />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          La utilidad usa el costo de insumos de lo que ya se vendió; lo comprado y sin usar cuenta como inventario.
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Ganancias por socio</h2>
        {r.porSocio.length === 0 ? (
          <p className="text-muted-foreground">Aún no hay lotes ni ventas con responsable.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Socio</TableHead>
                <TableHead className="text-right">Unidades producidas</TableHead>
                <TableHead className="text-right">Vendido</TableHead>
                <TableHead className="text-right">Por producir</TableHead>
                <TableHead className="text-right">Por vender</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {r.porSocio.map((s) => (
                <TableRow key={s.nombre}>
                  <TableCell className="font-medium">{s.nombre}</TableCell>
                  <TableCell className="text-right">{s.unidadesProducidas}</TableCell>
                  <TableCell className="text-right">{mxn(s.ventasHechas)}</TableCell>
                  <TableCell className="text-right">{mxn(s.porProduccion)}</TableCell>
                  <TableCell className="text-right">{mxn(s.porVenta)}</TableCell>
                  <TableCell className="text-right font-semibold">{mxn(s.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          Los porcentajes se cambian en &quot;Utilidades y reparto&quot;. Producción se reparte según unidades
          producidas y venta según lo vendido por cada socio.
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Por producto</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead className="text-right">Producidas</TableHead>
              <TableHead className="text-right">Vendidas</TableHead>
              <TableHead className="text-right">En bodega</TableHead>
              <TableHead className="text-right">Ventas</TableHead>
              <TableHead className="text-right">Ganancia bruta</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {r.porProducto.map((p) => (
              <TableRow key={p.nombre}>
                <TableCell className="font-medium">{p.nombre}</TableCell>
                <TableCell className="text-right">{p.producidas}</TableCell>
                <TableCell className="text-right">{p.vendidas}</TableCell>
                <TableCell className="text-right">{p.disponibles}</TableCell>
                <TableCell className="text-right">{mxn(p.ingreso)}</TableCell>
                <TableCell className="text-right">{mxn(p.ingreso - p.costo)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="mt-2 text-xs text-muted-foreground">
          Ganancia bruta = ventas menos el costo de insumos de lo vendido.
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Lotes</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Salsa</TableHead>
              <TableHead>Producción</TableHead>
              <TableHead>Caducidad</TableHead>
              <TableHead className="text-right">Hechas</TableHead>
              <TableHead className="text-right">Vendidas</TableHead>
              <TableHead className="text-right">En bodega</TableHead>
              <TableHead className="text-right">Consignación</TableHead>
              <TableHead className="text-right">Costo insumos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {r.detalleLotes.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="font-medium">{l.producto ?? "—"}</TableCell>
                <TableCell>{fmtFecha(l.fechaProduccion)}</TableCell>
                <TableCell>{fmtFecha(l.fechaCaducidad)}</TableCell>
                <TableCell className="text-right">{l.producidas}</TableCell>
                <TableCell className="text-right">{l.vendidas}</TableCell>
                <TableCell className="text-right">{l.disponible}</TableCell>
                <TableCell className="text-right">{l.enConsignacion}</TableCell>
                <TableCell className="text-right">{mxn(l.costo)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Gastos</h2>
        {r.tablaGastos.length === 0 ? (
          <p className="text-muted-foreground">Aún no hay gastos registrados.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {r.tablaGastos.map((g, i) => (
                <TableRow key={i}>
                  <TableCell>{fmtFecha(g.fecha)}</TableCell>
                  <TableCell>{g.concepto}</TableCell>
                  <TableCell>{g.tipo}</TableCell>
                  <TableCell className="text-right">{mxn(g.monto)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}
