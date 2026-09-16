import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresca la sesión de Supabase en cada request y decide si un visitante
 * sin sesión puede seguir hacia /portal/**. La verificación fina (¿su email
 * está en la tabla socios?) vive en app/portal/layout.tsx, porque requiere
 * una consulta a la base de datos que no queremos hacer en cada request de
 * middleware (assets, prefetch, etc.).
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPortalRoute = request.nextUrl.pathname.startsWith("/portal");
  const isLoginRoute = request.nextUrl.pathname.startsWith("/portal/login");
  const isAuthCallback = request.nextUrl.pathname.startsWith(
    "/portal/auth/callback"
  );

  if (isPortalRoute && !isLoginRoute && !isAuthCallback && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/portal/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
