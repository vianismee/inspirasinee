import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    const supabase = await createClient();
    const offset = (page - 1) * limit;

    let query = supabase
      .from("customer_points")
      .select(`
        *,
        customer:customer_id(username, email, whatsapp)
      `)
      .order("current_balance", { ascending: false });

    // Apply search filter if provided
    if (search) {
      query = query.or(`customer.username.ilike.%${search}%,customer.email.ilike.%${search}%`);
    }

    // Get paginated results
    const { data: customers, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching customer points:", error);
      return NextResponse.json(
        { error: "Failed to fetch customer points" },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from("customer_points")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      customers: customers || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        pages: Math.ceil((totalCount || 0) / limit)
      }
    });

  } catch (error) {
    console.error("Error in customer points API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, pointsChange, description } = body;

    if (!customerId || !pointsChange) {
      return NextResponse.json(
        { error: "Missing required fields: customerId, pointsChange" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get current customer points
    const { data: currentPoints, error: fetchError } = await supabase
      .from("customer_points")
      .select("*")
      .eq("customer_id", customerId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error("Error fetching customer points:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch customer points" },
        { status: 500 }
      );
    }

    if (!currentPoints) {
      return NextResponse.json(
        { error: "Customer points not found" },
        { status: 404 }
      );
    }

    // Calculate new balance
    const newBalance = currentPoints.current_balance + pointsChange;

    // Update customer points
    const { error: updateError } = await supabase
      .from("customer_points")
      .update({
        current_balance: newBalance,
        total_earned: pointsChange > 0 ? currentPoints.total_earned + pointsChange : currentPoints.total_earned,
        total_redeemed: pointsChange < 0 ? currentPoints.total_redeemed + Math.abs(pointsChange) : currentPoints.total_redeemed,
        updated_at: new Date().toISOString()
      })
      .eq("customer_id", customerId);

    if (updateError) {
      console.error("Error updating customer points:", updateError);
      return NextResponse.json(
        { error: "Failed to update customer points" },
        { status: 500 }
      );
    }

    // Record transaction
    const { error: transactionError } = await supabase
      .from("points_transactions")
      .insert({
        customer_id: customerId,
        transaction_type: pointsChange > 0 ? 'earned' : 'redeemed',
        points_change: pointsChange,
        balance_after: newBalance,
        reference_type: 'manual_adjustment',
        description: description || `Manual adjustment: ${pointsChange > 0 ? '+' : ''}${pointsChange} points`
      });

    if (transactionError) {
      console.error("Error recording transaction:", transactionError);
      return NextResponse.json(
        { error: "Failed to record transaction" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      newBalance,
      message: `Points ${pointsChange > 0 ? 'added to' : 'deducted from'} customer successfully`
    });

  } catch (error) {
    console.error("Error in manual points adjustment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}