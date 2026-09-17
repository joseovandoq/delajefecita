"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { borrarCostoEvento } from "./actions";

export function BorrarCostoEventoButton({
  id,
  eventoId,
}: {
  id: string;
  eventoId: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("¿Borrar este costo?")) return;
    startTransition(() => borrarCostoEvento(id, eventoId));
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleClick} disabled={isPending}>
      Quitar
    </Button>
  );
}
