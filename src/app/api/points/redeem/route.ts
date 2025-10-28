import { NextRequest, NextResponse } from "next/server";
import { SimpleReferralService } from "@/lib/referral/simple-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, pointsToRedeem } = body;

    if (!customerId || !pointsToRedeem) {
      return NextResponse.json(
        { error: "Missing required fields: customerId, pointsToRedeem" },
        { status: 400 }
      );
    }

    if (typeof pointsToRedeem !== 'number' || pointsToRedeem <= 0) {
      return NextResponse.json(
        { error: "Points to redeem must be a positive number" },
        { status: 400 }
      );
    }

    const referralService = SimpleReferralService.getInstance();
    const result = await referralService.validatePointsRedemption(customerId, pointsToRedeem);

    return NextResponse.json(result);

  } catch (error) {
    console.error("Error in points redemption API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}