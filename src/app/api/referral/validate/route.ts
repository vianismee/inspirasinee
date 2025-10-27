import { NextRequest, NextResponse } from "next/server";
import { SimpleReferralService } from "@/lib/referral/simple-service";

export async function POST(request: NextRequest) {
  try {
    console.log("=== REFERRAL VALIDATION API CALLED ===");

    const body = await request.json();
    const { referralCode, customerId } = body;

    console.log("Request body received:", { referralCode, customerId });

    if (!referralCode || !customerId) {
      return NextResponse.json(
        { error: "Missing required fields: referralCode, customerId" },
        { status: 400 }
      );
    }

    console.log("About to call referralService.validateReferralCode");

    const referralService = SimpleReferralService.getInstance();
    const result = await referralService.validateReferralCode(referralCode, customerId);

    console.log("Referral validation result:", result);

    return NextResponse.json(result);

  } catch (error) {
    console.error("Error in referral validation API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}