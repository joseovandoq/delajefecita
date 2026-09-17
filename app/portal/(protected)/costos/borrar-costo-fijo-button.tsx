"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { borrarCostoFijo } from "./actions";

export function BorrarCostoFijoButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("¿Borrar este gasto? No se puede deshacer.")) return;
    startTransition(() => borrarCostoFijo(id));
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleClick} disabled={isPending}>
      Borrar
    </Button>
  );
}
