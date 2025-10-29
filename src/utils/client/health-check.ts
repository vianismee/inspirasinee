import { createClient } from "@/utils/supabase/client";

export interface HealthCheckResult {
  status: "healthy" | "unhealthy" | "error";
  tables: Record<string, "exists" | "missing" | "error">;
  issues: string[];
  timestamp: string;
  connectivity?: {
    supabaseUrl: string;
    connected: boolean;
    error?: string;
    latency?: number;
  };
}

export async function performHealthCheck(): Promise<HealthCheckResult> {
  const result: HealthCheckResult = {
    status: "healthy",
    tables: {},
    issues: [],
    timestamp: new Date().toISOString(),
    connectivity: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "unknown",
      connected: false
    }
  };

  try {
    const supabase = createClient();

    // Test basic connectivity
    try {
      const startTime = Date.now();
      const { error } = await supabase.from("customers").select("id").limit(1);
      const latency = Date.now() - startTime;

      result.connectivity!.connected = !error;
      result.connectivity!.latency = latency;

      if (error) {
        result.connectivity!.error = error.message;
        result.issues.push(`Supabase connection failed: ${error.message}`);
      }
    } catch (connError) {
      result.connectivity!.connected = false;
      result.connectivity!.error = connError instanceof Error ? connError.message : "Unknown connection error";
      result.issues.push(`Supabase connection error: ${result.connectivity!.error}`);
    }

    // Check table existence - these are the key tables for the application
    const tablesToCheck = [
      "customers",
      "orders",
      "services",
      "discounts",
      "referral_settings",
      "customer_points",
      "referral_usage",
      "points_transactions"
    ];

    for (const table of tablesToCheck) {
      try {
        const { error } = await supabase.from(table).select("id").limit(1);
        result.tables[table] = error ? "missing" : "exists";
        if (error) {
          result.issues.push(`${table} table not found or inaccessible`);
        }
      } catch {
        result.tables[table] = "error";
        result.issues.push(`Error checking ${table} table`);
      }
    }

    if (result.issues.length > 0) {
      result.status = "unhealthy";
    }

  } catch (error) {
    result.status = "error";
    result.issues.push(`Health check failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  return result;
}

export async function testBasicConnectivity(): Promise<{ connected: boolean; error?: string; latency?: number }> {
  const startTime = Date.now();

  try {
    const supabase = createClient();
    const { error } = await supabase.from("customers").select("id").limit(1);
    const latency = Date.now() - startTime;

    return {
      connected: !error,
      error: error?.message,
      latency
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : "Unknown error",
      latency: Date.now() - startTime
    };
  }
}