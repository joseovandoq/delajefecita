import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // La landing publica no necesita sesion: no gastar tiempo en Supabase.
  if (!request.nextUrl.pathname.startsWith("/portal")) {
    return NextResponse.next({ request });
  }

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

  // getClaims valida el JWT localmente (y refresca la sesion si caduco);
  // getUser hacia un viaje de red a Supabase en cada clic.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims ?? null;

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

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
