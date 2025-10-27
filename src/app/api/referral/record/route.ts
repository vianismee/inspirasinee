import { NextRequest, NextResponse } from "next/server";
import { SimpleReferralService } from "@/lib/referral/simple-service";

export async function POST(request: NextRequest) {
  try {
    console.log("=== RECORD REFERRAL USAGE API CALLED ===");

    const body = await request.json();
    const { referralCode, customerId, orderInvoiceId, pointsUsed, pointsDiscount } = body;

    console.log("Recording referral usage:", { referralCode, customerId, orderInvoiceId, pointsUsed, pointsDiscount });

    if (!referralCode || !customerId || !orderInvoiceId) {
      return NextResponse.json(
        { error: "Missing required fields: referralCode, customerId, orderInvoiceId" },
        { status: 400 }
      );
    }

    const referralService = SimpleReferralService.getInstance();
    const result = await referralService.recordReferralUsage(referralCode, customerId, orderInvoiceId, pointsUsed, pointsDiscount);

    console.log("Referral usage recording result:", result);

    return NextResponse.json(result);

  } catch (error) {
    console.error("Error in referral usage recording API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}