"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { borrarInsumo } from "./actions";

export function BorrarInsumoButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("¿Borrar este insumo? No se puede deshacer.")) return;
    startTransition(() => borrarInsumo(id));
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleClick} disabled={isPending}>
      Borrar
    </Button>
  );
}
