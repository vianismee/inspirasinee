import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Step 1: Check basic environment
    const step1 = {
      status: "checking_environment",
      NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV || "NOT_SET",
      NODE_ENV: process.env.NODE_ENV || "NOT_SET",
      VERCEL_ENV: process.env.VERCEL_ENV || "NOT_SET"
    };

    // Step 2: Check Supabase URL and keys
    const step2 = {
      status: "checking_supabase_config",
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasPublishableKey: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
      publishableKeyLength: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.length || 0,
      serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
    };

    // Step 3: Test basic import and schema determination
    let step3: { status: string; error: string | null; schema?: string } = { status: "checking_imports", error: null };
    try {
      const schema = process.env.NEXT_PUBLIC_APP_ENV === "development" ? "dev" : "public";
      step3 = {
        status: "imports_successful",
        schema,
        error: null
      };
    } catch (error) {
      step3 = {
        status: "import_failed",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }

    // Step 4: Test Supabase client creation
    let step4: { status: string; error: string | null } = { status: "checking_supabase_client", error: null };
    try {
      const { createClient } = await import("@/utils/supabase/server");
      const client = await createClient();
      step4 = {
        status: "client_created_successfully",
        error: null
      };
    } catch (error) {
      step4 = {
        status: "client_creation_failed",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }

    // Step 5: Test simple database query
    let step5: { status: string; error: string | null; data: string | null } = { status: "checking_database_connection", error: null, data: null };
    try {
      const { createClient } = await import("@/utils/supabase/server");
      const client = await createClient();
      const { data, error } = await client
        .from('customers')
        .select('count')
        .limit(1);

      if (error) {
        step5 = {
          status: "database_query_failed",
          error: error.message,
          data: null
        };
      } else {
        step5 = {
          status: "database_query_successful",
          error: null,
          data: "query_executed_successfully"
        };
      }
    } catch (error) {
      step5 = {
        status: "database_connection_failed",
        error: error instanceof Error ? error.message : "Unknown error",
        data: null
      };
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      steps: [step1, step2, step3, step4, step5],
      overall_status: step5.error ? "FAILED" : "SUCCESS"
    });

  } catch (error) {
    console.error("Simple check error:", error);
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      error: "Simple check failed",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : null
    }, { status: 500 });
  }
}