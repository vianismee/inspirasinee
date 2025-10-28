import { NextRequest, NextResponse } from "next/server";
import { SimpleReferralService } from "@/lib/referral/simple-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, pointsToDeduct, orderId } = body;

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

    return NextResponse.json(result);

  } catch (error) {
    console.error("Error in points deduction API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}