"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type Modulo = { href: string; label: string };

function estaActivo(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks({
  modulos,
  onNavigate,
}: {
  modulos: Modulo[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {modulos.map((m) => (
        <Link
          key={m.href}
          href={m.href}
          onClick={onNavigate}
          className={`rounded-md px-2 py-2.5 text-sm hover:bg-muted md:py-2 ${
            estaActivo(pathname, m.href) ? "bg-muted font-medium" : ""
          }`}
        >
          {m.label}
        </Link>
      ))}
    </nav>
  );
}

/**
 * Barra superior solo para celular: el menu lateral es `hidden md:block`,
 * asi que sin esto no habia ninguna forma de navegar desde el telefono.
 */
export function MobileNav({ modulos, nombre }: { modulos: Modulo[]; nombre: string }) {
  const [abierto, setAbierto] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setAbierto(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b bg-background md:hidden">
      <div className="flex items-center justify-between px-4 py-2">
        <Link href="/portal/resumen" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="De La Jefecita"
            width={64}
            height={64}
            className="h-9 w-9 rounded-md"
          />
          <span className="text-sm font-semibold">De La Jefecita</span>
        </Link>
        <button
          type="button"
          onClick={() => setAbierto((a) => !a)}
          aria-expanded={abierto}
          aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
          className="flex h-10 w-10 items-center justify-center rounded-md border"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            {abierto ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>
      {abierto && (
        <div className="max-h-[calc(100vh-3.5rem)] overflow-y-auto border-t px-3 pb-4 pt-2">
          <p className="px-2 pb-2 text-xs text-muted-foreground">Hola, {nombre}</p>
          <NavLinks modulos={modulos} onNavigate={() => setAbierto(false)} />
        </div>
      )}
    </header>
  );
}
