"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { borrarCategoriaReparto } from "./actions";

export function BorrarCategoriaButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("¿Borrar esta categoría de reparto?")) return;
    startTransition(() => borrarCategoriaReparto(id));
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleClick} disabled={isPending}>
      Borrar
    </Button>
  );
}
