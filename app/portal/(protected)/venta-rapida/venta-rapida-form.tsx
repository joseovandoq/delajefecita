"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { totalPorCantidad } from "@/lib/precios";
import { registrarVentaRapida, type VentaRapidaResult } from "./actions";

type Producto = {
  id: string;
  nombre: string;
  precioVenta: number | null;
  precioMayoreo: number | null;
  mayoreoDesde: number;
  enBodega: number;
};
type Opcion = { id: string; nombre: string };

const METODOS = [
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "terminal", label: "Terminal" },
] as const;

const selectClass =
  "h-10 w-full rounded-md border bg-background px-3 text-sm";

function leer(clave: string) {
  try {
    return window.localStorage.getItem(clave) ?? "";
  } catch {
    return "";
  }
}
function guardar(clave: string, valor: string) {
  try {
    window.localStorage.setItem(clave, valor);
  } catch {
    // sin storage: solo no se recuerda la ultima eleccion
  }
}

export function VentaRapidaForm({
  productos,
  puntos,
  eventos,
}: {
  productos: Producto[];
  puntos: Opcion[];
  eventos: Opcion[];
}) {
  const [state, formAction] = useFormState<VentaRapidaResult, FormData>(
    registrarVentaRapida,
    undefined
  );
  const [productoId, setProductoId] = useState(productos[0]?.id ?? "");
  const [cantidad, setCantidad] = useState(1);
  const [total, setTotal] = useState("");
  const [totalEditado, setTotalEditado] = useState(false);
  const [metodo, setMetodo] = useState<string>("efectivo");
  const [puntoId, setPuntoId] = useState(puntos[0]?.id ?? "");
  const [eventoId, setEventoId] = useState("");

  const producto = productos.find((p) => p.id === productoId);

  useEffect(() => {
    const punto = leer("vr-punto");
    if (punto && puntos.some((p) => p.id === punto)) setPuntoId(punto);
    const metodoGuardado = leer("vr-metodo");
    if (metodoGuardado) setMetodo(metodoGuardado);
    const evento = leer("vr-evento");
    if (evento && eventos.some((e) => e.id === evento)) setEventoId(evento);
  }, [puntos, eventos]);

  // Precio automatico por cantidad, salvo que ya lo hayan editado a mano.
  useEffect(() => {
    if (totalEditado || !producto) return;
    const t = totalPorCantidad(
      producto.precioVenta,
      producto.precioMayoreo,
      producto.mayoreoDesde,
      cantidad
    );
    setTotal(t === null ? "" : String(t));
  }, [producto, cantidad, totalEditado]);

  // Despues de una venta guardada se limpia para la siguiente.
  useEffect(() => {
    if (state?.ok) {
      setCantidad(1);
      setTotalEditado(false);
    }
  }, [state]);

  if (productos.length === 0) {
    return <p className="text-muted-foreground">No hay salsa en bodega para vender.</p>;
  }

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-5">
      <input type="hidden" name="productoId" value={productoId} />
      <input type="hidden" name="metodoPago" value={metodo} />

      <div>
        <p className="mb-2 text-sm font-medium">Salsa</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {productos.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setProductoId(p.id);
                setTotalEditado(false);
              }}
              className={`rounded-lg border p-3 text-left transition-colors ${
                p.id === productoId ? "border-primary bg-primary/10" : "hover:bg-muted"
              }`}
            >
              <span className="block font-medium">{p.nombre}</span>
              <span className="text-xs text-muted-foreground">
                {p.enBodega} en bodega
                {p.precioVenta !== null && ` · $${p.precioVenta}`}
                {p.precioMayoreo !== null && ` ($${p.precioMayoreo} desde ${p.mayoreoDesde})`}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="mb-2 text-sm font-medium">Cantidad</p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => {
                setCantidad((c) => Math.max(1, c - 1));
                setTotalEditado(false);
              }}
            >
              −
            </Button>
            <input type="hidden" name="cantidad" value={cantidad} />
            <span className="w-10 text-center text-2xl font-semibold">{cantidad}</span>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => {
                setCantidad((c) => c + 1);
                setTotalEditado(false);
              }}
            >
              +
            </Button>
          </div>
        </div>
        <div>
          <label htmlFor="total-vr" className="mb-2 block text-sm font-medium">
            Total cobrado
          </label>
          <input
            id="total-vr"
            name="total"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            value={total}
            onChange={(e) => {
              setTotal(e.target.value);
              setTotalEditado(true);
            }}
            className="h-10 w-full rounded-md border bg-background px-3 text-lg font-semibold"
            required
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Pago</p>
        <div className="grid grid-cols-3 gap-2">
          {METODOS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => {
                setMetodo(m.value);
                guardar("vr-metodo", m.value);
              }}
              className={`rounded-lg border p-3 text-sm font-medium transition-colors ${
                metodo === m.value ? "border-primary bg-primary/10" : "hover:bg-muted"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="punto-vr" className="mb-2 block text-sm font-medium">
            Punto de venta
          </label>
          <select
            id="punto-vr"
            name="puntoVentaId"
            value={puntoId}
            onChange={(e) => {
              setPuntoId(e.target.value);
              guardar("vr-punto", e.target.value);
            }}
            className={selectClass}
            required
          >
            {puntos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="evento-vr" className="mb-2 block text-sm font-medium">
            Evento (opcional)
          </label>
          <select
            id="evento-vr"
            name="eventoId"
            value={eventoId}
            onChange={(e) => {
              setEventoId(e.target.value);
              guardar("vr-evento", e.target.value);
            }}
            className={selectClass}
          >
            <option value="">Sin evento</option>
            {eventos.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.ok && <p className="text-sm font-medium text-green-600">{state.ok}</p>}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="h-12 text-base">
      {pending ? "Guardando…" : "Cobrar"}
    </Button>
  );
}
