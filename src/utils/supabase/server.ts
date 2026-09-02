import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server Components & Server Actions — SELALU anon key, subjek RLS.
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — middleware sudah refresh session.
          }
        },
      },
      db: {
        schema: "public",
      },
    }
  );
}

// HANYA untuk route handler (bypass RLS). Tanpa cookies — murni DB.
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY not set");
  }
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // no-op — admin client tidak menyentuh session
        },
      },
      db: {
        schema: "public",
      },
    }
  );
}
