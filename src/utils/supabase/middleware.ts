import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Tentukan skema berdasarkan environment variable
  const schema =
    process.env.NEXT_PUBLIC_APP_ENV === "development" ? "dev" : "public";

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, // Tetap gunakan ANON_KEY
    {
      cookies: {
        // ... (kode cookies tidak berubah)
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
      db: {
        schema: schema, // <-- TAMBAHKAN OPSI INI
      },
    }
  );

  // ... sisa kode tidak berubah
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Temporary bypass for development - remove this after setting up admin user
  if (process.env.NODE_ENV === 'development') {
    // Allow access to admin routes during development
    return supabaseResponse;
  }

  if (!user && request.nextUrl.pathname.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
