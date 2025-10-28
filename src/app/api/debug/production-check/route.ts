import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const env = process.env.NEXT_PUBLIC_APP_ENV || "development";
    const schema = env === "development" ? "dev" : "public";

    const debugInfo = {
      environment: env,
      schema: schema,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasPublishableKey: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      timestamp: new Date().toISOString()
    };

    // Test database connection
    const supabase = await createClient();

    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('customers')
      .select('count')
      .limit(1);

    // Test if tables exist
    const tablesToCheck = [
      'customers',
      'orders',
      'referral_settings',
      'customer_points',
      'dashboard_sessions'
    ];

    const tableResults: Record<string, { exists: boolean; error: string | null }> = {};
    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        tableResults[table] = {
          exists: !error,
          error: error?.message || null
        };
      } catch (err) {
        tableResults[table] = {
          exists: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        };
      }
    }

    return NextResponse.json({
      debug: debugInfo,
      database: {
        connection: {
          success: !connectionError,
          error: connectionError?.message || null
        },
        tables: tableResults
      }
    });

  } catch (error) {
    console.error("Debug API error:", error);
    return NextResponse.json({
      error: "Debug API failed",
      message: error instanceof Error ? error.message : "Unknown error",
      env: process.env.NEXT_PUBLIC_APP_ENV
    }, { status: 500 });
  }
}