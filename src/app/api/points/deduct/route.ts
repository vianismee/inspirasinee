import { NextRequest, NextResponse } from "next/server";
import { SimpleReferralService } from "@/lib/referral/simple-service";

export async function POST(request: NextRequest) {
  try {
    console.log("=== POINTS DEDUCTION API CALLED ===");

    const body = await request.json();
    const { customerId, pointsToDeduct, orderId } = body;

    console.log("Deducting points:", { customerId, pointsToDeduct, orderId });

    if (!customerId || !pointsToDeduct || !orderId) {
      return NextResponse.json(
        { error: "Missing required fields: customerId, pointsToDeduct, orderId" },
        { status: 400 }
      );
    }

    if (typeof pointsToDeduct !== 'number' || pointsToDeduct <= 0) {
      return NextResponse.json(
        { error: "Points to deduct must be a positive number" },
        { status: 400 }
      );
    }

    const referralService = SimpleReferralService.getInstance();
    const result = await referralService.deductPoints(customerId, pointsToDeduct, orderId);

    console.log("Points deduction result:", result);

    return NextResponse.json(result);

  } catch (error) {
    console.error("Error in points deduction API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}