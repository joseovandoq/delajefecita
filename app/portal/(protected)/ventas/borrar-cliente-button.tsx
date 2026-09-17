"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { borrarCliente } from "./actions";

export function BorrarClienteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("¿Borrar este cliente?")) return;
    startTransition(() => borrarCliente(id));
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleClick} disabled={isPending}>
      Borrar
    </Button>
  );
}
