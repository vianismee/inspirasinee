import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const supabase = await createClient();

    // Build date filter
    let dateFilter = {};
    if (startDate || endDate) {
      const filters: any = {};
      if (startDate) filters.gte = startDate;
      if (endDate) filters.lte = endDate;
      dateFilter = { used_at: filters };
    }

    // Get referral usage statistics
    const { data: referralStats, error: referralError } = await supabase
      .from("referral_usage")
      .select(`
        *,
        referrer:referrer_customer_id(username, email),
        referred:referred_customer_id(username, email)
      `)
      .order("used_at", { ascending: false });

    if (referralError) {
      console.error("Error fetching referral stats:", referralError);
      return NextResponse.json(
        { error: "Failed to fetch referral analytics" },
        { status: 500 }
      );
    }

    // Get customer points statistics
    const { data: pointsStats, error: pointsError } = await supabase
      .from("customer_points")
      .select(`
        *,
        customer:customer_id(username, email)
      `)
      .order("current_balance", { ascending: false });

    if (pointsError) {
      console.error("Error fetching points stats:", pointsError);
      return NextResponse.json(
        { error: "Failed to fetch points analytics" },
        { status: 500 }
      );
    }

    // Get points transaction history
    const { data: transactions, error: transactionError } = await supabase
      .from("points_transactions")
      .select(`
        *,
        customer:customer_id(username, email)
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (transactionError) {
      console.error("Error fetching transactions:", transactionError);
      return NextResponse.json(
        { error: "Failed to fetch transaction history" },
        { status: 500 }
      );
    }

    // Calculate summary statistics
    const totalReferrals = referralStats?.length || 0;
    const totalReferralDiscount = referralStats?.reduce((sum, r) => sum + r.discount_applied, 0) || 0;
    const totalPointsAwarded = referralStats?.reduce((sum, r) => sum + r.points_awarded, 0) || 0;
    const totalPointsRedeemed = transactions?.filter(t => t.transaction_type === 'redeemed')
      .reduce((sum, t) => sum + Math.abs(t.points_change), 0) || 0;
    const activeCustomersWithPoints = pointsStats?.filter(p => p.current_balance > 0).length || 0;

    // Get top referrers
    const topReferrers = referralStats?.reduce((acc: any, referral) => {
      const existing = acc.find((r: any) => r.referrer_customer_id === referral.referrer_customer_id);
      if (existing) {
        existing.referralCount += 1;
        existing.totalPointsEarned += referral.points_awarded;
      } else {
        acc.push({
          referrer_customer_id: referral.referrer_customer_id,
          referrer_name: referral.referrer?.username || referral.referrer?.email,
          referralCount: 1,
          totalPointsEarned: referral.points_awarded
        });
      }
      return acc;
    }, []).sort((a: any, b: any) => b.referralCount - a.referralCount).slice(0, 10) || [];

    const analytics = {
      summary: {
        totalReferrals,
        totalReferralDiscount,
        totalPointsAwarded,
        totalPointsRedeemed,
        activeCustomersWithPoints,
        totalCustomersWithPoints: pointsStats?.length || 0
      },
      topReferrers,
      recentReferrals: referralStats?.slice(0, 20) || [],
      pointsDistribution: pointsStats?.slice(0, 20) || [],
      recentTransactions: transactions?.slice(0, 50) || []
    };

    return NextResponse.json(analytics);

  } catch (error) {
    console.error("Error in referral analytics API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}