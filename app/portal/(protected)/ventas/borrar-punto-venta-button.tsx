"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { borrarPuntoVenta } from "./actions";

export function BorrarPuntoVentaButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("¿Borrar este punto de venta? No se puede deshacer.")) return;
    startTransition(() => borrarPuntoVenta(id));
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleClick} disabled={isPending}>
      Borrar
    </Button>
  );
}
