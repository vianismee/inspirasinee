import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "./utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Cek apakah path saat ini adalah halaman utama ("/")
  if (request.nextUrl.pathname === "/") {
    // Jika ya, arahkan langsung ke halaman "/tracking"
    // Menggunakan request.url sebagai basis untuk memastikan domain tetap sama
    return NextResponse.redirect(new URL("/tracking", request.url));
  }

  // Untuk semua path lainnya, jalankan fungsi updateSession dari Supabase
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
