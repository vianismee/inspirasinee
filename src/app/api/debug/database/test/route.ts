import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    console.log("🔍 TESTING DATABASE CONNECTION AND TABLES");

    // Get environment info
    const env = process.env.NEXT_PUBLIC_APP_ENV || "development";
    const schema = env === "development" ? "dev" : "public";
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

    console.log(`🌍 Environment: ${env}`);
    console.log(`📊 Schema: ${schema}`);
    console.log(`🔗 Supabase URL: ${supabaseUrl}`);

    // Test Supabase connection
    console.log("🔌 Testing Supabase connection...");
    const supabase = await createClient();
    console.log("✅ Supabase connection successful");

    // Test if tables exist
    const results: {
      environment: string;
      schema: string;
      supabaseUrl: string;
      tables: Record<string, { exists: boolean; count?: number; error?: string; sampleData?: unknown }>;
      errors: string[];
      writePermission?: { success: boolean; error?: string; testRecord?: unknown };
      sampleData: {
        customers: number;
        orders: number;
        points: number;
      };
    } = {
      environment: env,
      schema: schema,
      supabaseUrl: supabaseUrl,
      tables: {},
      errors: [],
      sampleData: {
        customers: 0,
        orders: 0,
        points: 0
      }
    };

    // Test dashboard_sessions table
    console.log("📋 Testing dashboard_sessions table...");
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from("dashboard_sessions")
        .select("*")
        .limit(1);

      if (sessionError) {
        console.error("❌ dashboard_sessions error:", sessionError);
        results.tables.dashboard_sessions = {
          exists: false,
          error: sessionError.message
        };
        results.errors.push(`dashboard_sessions: ${sessionError.message}`);
      } else {
        console.log("✅ dashboard_sessions table exists");
        results.tables.dashboard_sessions = {
          exists: true,
          sampleData: sessionData
        };
      }
    } catch (error) {
      console.error("❌ dashboard_sessions exception:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.tables.dashboard_sessions = {
        exists: false,
        error: errorMessage
      };
      results.errors.push(`dashboard_sessions: ${errorMessage}`);
    }

    // Test dashboard_access_logs table
    console.log("📋 Testing dashboard_access_logs table...");
    try {
      const { data: logsData, error: logsError } = await supabase
        .from("dashboard_access_logs")
        .select("*")
        .limit(1);

      if (logsError) {
        console.error("❌ dashboard_access_logs error:", logsError);
        results.tables.dashboard_access_logs = {
          exists: false,
          error: logsError.message
        };
        results.errors.push(`dashboard_access_logs: ${logsError.message}`);
      } else {
        console.log("✅ dashboard_access_logs table exists");
        results.tables.dashboard_access_logs = {
          exists: true,
          sampleData: logsData
        };
      }
    } catch (error) {
      console.error("❌ dashboard_access_logs exception:", error);
      results.tables.dashboard_access_logs = {
        exists: false,
        error: error instanceof Error ? error.message : String(error)
      };
      const logErrorMessage = error instanceof Error ? error.message : String(error);
      results.errors.push(`dashboard_access_logs: ${logErrorMessage}`);
    }

    // Test customers table (for debugging)
    console.log("📋 Testing customers table...");
    try {
      const { data: customersData, error: customersError } = await supabase
        .from("customers")
        .select("customer_id, whatsapp, phone")
        .limit(3);

      if (customersError) {
        console.error("❌ customers table error:", customersError);
        results.tables.customers = {
          exists: false,
          error: customersError.message
        };
      } else {
        console.log("✅ customers table exists");
        results.tables.customers = {
          exists: true,
          sampleData: customersData,
          count: customersData?.length || 0
        };
      }
    } catch (error) {
      console.error("❌ customers table exception:", error);
      results.tables.customers = {
        exists: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }

    // Test table creation permissions (try to create a test record)
    console.log("🧪 Testing write permissions...");
    try {
      const testRecord = {
        hash: "test_hash_123",
        phone: "+628123456789",
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        ip_address: "127.0.0.1",
        user_agent: "test-agent"
      };

      const { data: insertData, error: insertError } = await supabase
        .from("dashboard_sessions")
        .insert(testRecord)
        .select()
        .single();

      if (insertError) {
        console.error("❌ Insert test failed:", insertError);
        results.writePermission = {
          success: false,
          error: insertError instanceof Error ? insertError.message : String(insertError)
        };
      } else {
        console.log("✅ Write permission test successful");
        results.writePermission = {
          success: true,
          testRecord: insertData
        };

        // Clean up test record
        await supabase
          .from("dashboard_sessions")
          .delete()
          .eq("hash", "test_hash_123");
      }
    } catch (error) {
      console.error("❌ Write permission test exception:", error);
      results.writePermission = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }

    console.log("🎯 DATABASE TEST COMPLETE");
    console.log("📊 Results:", results);

    return NextResponse.json({
      success: true,
      message: "Database test completed",
      ...results
    });

  } catch (error) {
    console.error("❌ DATABASE TEST FAILED:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: "Database test failed"
      },
      { status: 500 }
    );
  }
}