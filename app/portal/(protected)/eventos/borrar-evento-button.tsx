"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { borrarEvento } from "./actions";

export function BorrarEventoButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("¿Borrar este evento? No se puede deshacer.")) return;
    startTransition(() => borrarEvento(id));
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleClick} disabled={isPending}>
      Borrar
    </Button>
  );
}
