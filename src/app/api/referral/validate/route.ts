import { NextRequest, NextResponse } from "next/server";
import { SimpleReferralService } from "@/lib/referral/simple-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { referralCode, customerId } = body;

    if (!referralCode || !customerId) {
      return NextResponse.json(
        { error: "Missing required fields: referralCode, customerId" },
        { status: 400 }
      );
    }

    const referralService = SimpleReferralService.getInstance();
    const result = await referralService.validateReferralCode(referralCode, customerId);

    return NextResponse.json(result);

  } catch (error) {
    console.error("Error in referral validation API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}