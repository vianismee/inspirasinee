import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const health: {
      status: string;
      tables: Record<string, string>;
      issues: string[];
    } = {
      status: "healthy",
      tables: {},
      issues: []
    };

    // Check if referral_settings table exists
    try {
      const { error: settingsError } = await supabase
        .from("referral_settings")
        .select("id")
        .limit(1);

      health.tables.referral_settings = settingsError ? "missing" : "exists";
      if (settingsError) {
        health.issues.push("referral_settings table not found");
      }
    } catch {
      health.tables.referral_settings = "error";
      health.issues.push("Error checking referral_settings table");
    }

    // Check if customer_points table exists
    try {
      const { error: pointsError } = await supabase
        .from("customer_points")
        .select("id")
        .limit(1);

      health.tables.customer_points = pointsError ? "missing" : "exists";
      if (pointsError) {
        health.issues.push("customer_points table not found");
      }
    } catch {
      health.tables.customer_points = "error";
      health.issues.push("Error checking customer_points table");
    }

    // Check if referral_usage table exists
    try {
      const { error: usageError } = await supabase
        .from("referral_usage")
        .select("id")
        .limit(1);

      health.tables.referral_usage = usageError ? "missing" : "exists";
      if (usageError) {
        health.issues.push("referral_usage table not found");
      }
    } catch {
      health.tables.referral_usage = "error";
      health.issues.push("Error checking referral_usage table");
    }

    // Check if points_transactions table exists
    try {
      const { error: transactionsError } = await supabase
        .from("points_transactions")
        .select("id")
        .limit(1);

      health.tables.points_transactions = transactionsError ? "missing" : "exists";
      if (transactionsError) {
        health.issues.push("points_transactions table not found");
      }
    } catch {
      health.tables.points_transactions = "error";
      health.issues.push("Error checking points_transactions table");
    }

    if (health.issues.length > 0) {
      health.status = "unhealthy";
    }

    return NextResponse.json(health);

  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      {
        status: "error",
        error: "Failed to perform health check",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}