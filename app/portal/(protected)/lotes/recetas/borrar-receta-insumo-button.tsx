"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { borrarRecetaInsumo } from "../actions";

export function BorrarRecetaInsumoButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("¿Quitar este insumo de la receta?")) return;
    startTransition(() => borrarRecetaInsumo(id));
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleClick} disabled={isPending}>
      Quitar
    </Button>
  );
}
