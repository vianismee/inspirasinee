import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // Always use public schema for simplicity
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      db: {
        schema: "public",
      },
    }
  );
}

let supabaseClient: ReturnType<typeof createClient> | null = null;

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClient();
  }
  return supabaseClient;
};

// Export default client instance for easy access
export const supabase = getSupabaseClient();
