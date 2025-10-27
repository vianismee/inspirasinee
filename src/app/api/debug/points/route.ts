import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: points, error } = await supabase
      .from("customer_points")
      .select("customer_id, current_balance, total_earned, total_redeemed, created_at")
      .limit(10);

    if (error) {
      console.error("Error fetching points:", error);
      return NextResponse.json(
        { error: "Failed to fetch points" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      points: points || [],
      count: points?.length || 0
    });

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}