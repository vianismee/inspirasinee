import { NextRequest, NextResponse } from "next/server";
import { SimplePointsService } from "@/lib/referral/simple-points";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");

    if (!customerId) {
      return NextResponse.json(
        { error: "Missing required parameter: customerId" },
        { status: 400 }
      );
    }

    const customerPoints = await SimplePointsService.getCustomerPoints(customerId);

    return NextResponse.json(customerPoints);

  } catch (error) {
    console.error("Error fetching customer balance:", error);

    // Return default points on any error to prevent breaking the UI
    const defaultPoints = {
      current_balance: 0,
      total_earned: 0,
      total_redeemed: 0
    };

    return NextResponse.json(defaultPoints);
  }
}