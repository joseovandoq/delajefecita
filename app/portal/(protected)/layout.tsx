import Image from "next/image";
import { requireSocio } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import { MobileNav, NavLinks, type Modulo } from "./nav";

const MODULOS: Modulo[] = [
  { href: "/portal/resumen", label: "Resumen" },
  { href: "/portal/venta-rapida", label: "Venta rápida" },
  { href: "/portal/lotes", label: "Lotes de producción" },
  { href: "/portal/insumos", label: "Insumos" },
  { href: "/portal/costos", label: "Costos" },
  { href: "/portal/ventas", label: "Ventas y puntos de venta" },
  { href: "/portal/eventos", label: "Eventos" },
  { href: "/portal/gastos", label: "Gastos" },
  { href: "/portal/utilidades", label: "Utilidades y reparto" },
];

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const socio = await requireSocio();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <MobileNav modulos={MODULOS} nombre={socio.nombre} />
      <aside className="hidden w-64 shrink-0 border-r bg-muted/30 p-4 md:block">
        <div className="mb-6 px-2">
          <Image
            src="/logo.png"
            alt="De La Jefecita"
            width={160}
            height={160}
            className="mb-2 w-24 rounded-lg"
            priority
          />
          <p className="text-sm text-muted-foreground">Hola, {socio.nombre}</p>
        </div>
        <NavLinks modulos={MODULOS} />
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      <Toaster />
    </div>
  );
}
