import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const schema =
    process.env.NEXT_PUBLIC_APP_ENV === "development" ? "dev" : "public";

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      db: {
        schema: schema,
      },
    }
  );
}
