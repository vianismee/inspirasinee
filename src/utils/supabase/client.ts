import { createBrowserClient } from "@supabase/ssr";
// import type { Database } from "@/types/database";

// Create enhanced browser client with additional configuration
export function createClient() {
  const schema =
    process.env.NEXT_PUBLIC_APP_ENV === "development" ? "dev" : "public";

  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      db: {
        schema: schema,
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        headers: {
          'X-Client-Info': 'inspirasinee-web-app',
        },
      },
    }
  );

  return client;
}

// Singleton instance for browser
let supabaseClient: ReturnType<typeof createClient> | null = null;

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClient();
  }
  return supabaseClient;
};

// Export default client instance for easy access
export const supabase = getSupabaseClient();
