"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { borrarLote } from "./actions";

export function BorrarLoteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("¿Borrar este lote? No se puede deshacer.")) return;
    startTransition(() => borrarLote(id));
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleClick} disabled={isPending}>
      Borrar
    </Button>
  );
}
