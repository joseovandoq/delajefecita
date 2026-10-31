"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { borrarGasto } from "./actions";

export function BorrarGastoButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("¿Borrar este gasto? No se puede deshacer.")) return;
    startTransition(() => borrarGasto(id));
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleClick} disabled={isPending}>
      Borrar
    </Button>
  );
}
