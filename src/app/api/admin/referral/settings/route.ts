import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET referral settings
export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("referral_settings")
      .select("*")
      .eq("is_active", true)
      .single();

    // Handle case where no settings exist yet
    if (error && error.code === 'PGRST116') {
      // Return default settings if none exist
      const defaultSettings = {
        id: 0,
        referral_discount_amount: 5000,
        referrer_points_earned: 10,
        points_redemption_minimum: 50,
        points_redemption_value: 100,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      return NextResponse.json(defaultSettings);
    }

    if (error) {
      console.error("Error fetching referral settings:", error);
      return NextResponse.json(
        { error: "Failed to fetch referral settings" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error("Error in GET referral settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT update referral settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      referral_discount_amount,
      referrer_points_earned,
      points_redemption_minimum,
      points_redemption_value,
      is_active
    } = body;

    const supabase = await createClient();

    // Get current settings
    const { data: currentSettings, error: fetchError } = await supabase
      .from("referral_settings")
      .select("*")
      .eq("is_active", true)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error("Error fetching current settings:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch current settings" },
        { status: 500 }
      );
    }

    let result;
    if (currentSettings) {
      // Update existing settings
      const { data, error } = await supabase
        .from("referral_settings")
        .update({
          referral_discount_amount,
          referrer_points_earned,
          points_redemption_minimum,
          points_redemption_value,
          is_active,
          updated_at: new Date().toISOString()
        })
        .eq("id", currentSettings.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating referral settings:", error);
        return NextResponse.json(
          { error: "Failed to update referral settings" },
          { status: 500 }
        );
      }

      result = data;
    } else {
      // Create new settings
      const { data, error } = await supabase
        .from("referral_settings")
        .insert({
          referral_discount_amount,
          referrer_points_earned,
          points_redemption_minimum,
          points_redemption_value,
          is_active
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating referral settings:", error);
        return NextResponse.json(
          { error: "Failed to create referral settings" },
          { status: 500 }
        );
      }

      result = data;
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error("Error in PUT referral settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}