import "server-only";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { socios } from "@/lib/db/schema";

/**
 * Valida que haya sesión de Supabase Y que el correo esté en la allowlist
 * de socios activos. Si algo falla, cierra sesión y manda a /portal/login.
 * Úsalo al inicio de cualquier Server Component/página bajo /portal.
 */
export async function requireSocio() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/portal/login");
  }

  const [socio] = await db
    .select()
    .from(socios)
    .where(eq(socios.email, user.email))
    .limit(1);

  if (!socio || !socio.activo) {
    await supabase.auth.signOut();
    redirect("/portal/login?error=no_autorizado");
  }

  return socio;
}
