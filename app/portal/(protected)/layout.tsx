import Link from "next/link";
import { requireSocio } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";

const MODULOS = [
  { href: "/portal/lotes", label: "Lotes de producción", activo: true },
  { href: "/portal/insumos", label: "Insumos", activo: false },
  { href: "/portal/costos", label: "Costos", activo: false },
  { href: "/portal/ventas", label: "Ventas y puntos de venta", activo: false },
  { href: "/portal/eventos", label: "Eventos", activo: false },
  { href: "/portal/utilidades", label: "Utilidades y reparto", activo: false },
];

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const socio = await requireSocio();

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r bg-muted/30 p-4 md:block">
        <div className="mb-6 px-2">
          <p className="font-semibold">De La Jefecita</p>
          <p className="text-sm text-muted-foreground">Hola, {socio.nombre}</p>
        </div>
        <nav className="flex flex-col gap-1">
          {MODULOS.map((m) =>
            m.activo ? (
              <Link
                key={m.href}
                href={m.href}
                className="rounded-md px-2 py-2 text-sm hover:bg-muted"
              >
                {m.label}
              </Link>
            ) : (
              <span
                key={m.href}
                className="flex items-center justify-between rounded-md px-2 py-2 text-sm text-muted-foreground/60"
              >
                {m.label}
                <span className="text-xs">Próximamente</span>
              </span>
            )
          )}
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
      <Toaster />
    </div>
  );
}
