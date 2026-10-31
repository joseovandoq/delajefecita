import "server-only";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { socios } from "@/lib/db/schema";

/**
 * Valida que haya sesión de Supabase Y que el correo esté en la allowlist
 * de socios activos. Si algo falla, cierra sesión y manda a /portal/login.
 * Úsalo al inicio de cualquier Server Component/página bajo /portal.
 *
 * `getClaims` verifica el JWT localmente (sin viaje de red a Supabase) y
 * `cache` evita repetir la validación y la consulta a `socios` cuando el
 * layout y la página/acción la piden en la misma petición.
 */
export const requireSocio = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = typeof data?.claims?.email === "string" ? data.claims.email : null;

  if (!email) {
    redirect("/portal/login");
  }

  const [socio] = await db
    .select()
    .from(socios)
    .where(eq(socios.email, email))
    .limit(1);

  if (!socio || !socio.activo) {
    await supabase.auth.signOut();
    redirect("/portal/login?error=no_autorizado");
  }

  return socio;
});
