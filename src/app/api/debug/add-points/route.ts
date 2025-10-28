import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, points } = body;

    if (!customerId || !points || typeof points !== 'number') {
      return NextResponse.json(
        { error: "Missing required fields: customerId, points (number)" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if customer already has points
    const { data: existingPoints, error: fetchError } = await supabase
      .from("customer_points")
      .select("*")
      .eq("customer_id", customerId)
      .single();

    let result;
    if (fetchError && fetchError.code === 'PGRST116') {
      // No existing points record, create one
      const { data, error } = await supabase
        .from("customer_points")
        .insert({
          customer_id: customerId,
          current_balance: points,
          total_earned: points,
          total_redeemed: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select("*")
        .single();

      if (error) throw error;
      result = data;
    } else if (fetchError) {
      throw fetchError;
    } else {
      // Update existing points
      const newBalance = (existingPoints.current_balance || 0) + points;
      const totalEarned = (existingPoints.total_earned || 0) + points;

      const { data, error } = await supabase
        .from("customer_points")
        .update({
          current_balance: newBalance,
          total_earned: totalEarned,
          updated_at: new Date().toISOString()
        })
        .eq("customer_id", customerId)
        .select("*")
        .single();

      if (error) throw error;
      result = data;
    }

    // Also record a transaction
    await supabase
      .from("points_transactions")
      .insert({
        customer_id: customerId,
        transaction_type: "earned",
        points_change: points,
        balance_after: result.current_balance,
        reference_type: "manual_adjustment",
        reference_id: "debug",
        description: "Debug: Manual points addition",
        created_at: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      points: result,
      message: `Added ${points} points to customer ${customerId}`
    });

  } catch (error) {
    console.error("Error adding points:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}