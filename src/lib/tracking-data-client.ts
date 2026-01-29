// Client-side data fetching functions for tracking page enrichment

import { createClient } from "@/utils/supabase/client";
import { PointsData, ReferralData, AdConfig, DUMMY_ADS } from "@/types/tracking";

/**
 * Fetch customer points data (client-side)
 */
export async function fetchCustomerPointsDataClient(customerId: string): Promise<PointsData | null> {
  try {
    const supabase = createClient();

    // Fetch customer points balance
    const { data: pointsData, error: pointsError } = await supabase
      .from("customer_points")
      .select("current_balance")
      .eq("customer_id", customerId)
      .maybeSingle();

    if (pointsError) {
      console.error("Error fetching points:", pointsError);
      // Return default data if no points record exists
      return {
        current_balance: 0,
        total_earned: 0,
        total_redeemed: 0,
      };
    }

    // Fetch total earned and redeemed from points transactions
    const { data: transactionsData } = await supabase
      .from("points_transactions")
      .select("transaction_type, points_change")
      .eq("customer_id", customerId);

    let total_earned = 0;
    let total_redeemed = 0;

    if (transactionsData) {
      transactionsData.forEach((t) => {
        if (t.transaction_type === "earned") {
          total_earned += t.points_change || 0;
        } else if (t.transaction_type === "redeemed") {
          total_redeemed += t.points_change || 0;
        }
      });
    }

    return {
      current_balance: pointsData?.current_balance || 0,
      total_earned,
      total_redeemed,
    };
  } catch (error) {
    console.error("Error fetching customer points:", error);
    return null;
  }
}

/**
 * Fetch customer referral data (client-side)
 */
export async function fetchCustomerReferralDataClient(customerId: string): Promise<ReferralData | null> {
  try {
    const supabase = createClient();

    // Fetch referral code
    const { data: referralData, error: referralError } = await supabase
      .from("referral_codes")
      .select("code")
      .eq("customer_id", customerId)
      .maybeSingle();

    if (referralError || !referralData) {
      return null;
    }

    // Fetch referral statistics
    const { data: referralsData } = await supabase
      .from("referrals")
      .select("id")
      .eq("referrer_id", customerId);

    const totalReferrals = referralsData?.length || 0;

    // Fetch points earned from referrals
    const { data: referralPointsData } = await supabase
      .from("points_transactions")
      .select("points_change")
      .eq("customer_id", customerId)
      .eq("reference_type", "referral");

    let totalPointsEarned = 0;
    if (referralPointsData) {
      referralPointsData.forEach((t) => {
        totalPointsEarned += t.points_change || 0;
      });
    }

    return {
      code: referralData.code,
      totalReferrals,
      totalPointsEarned,
    };
  } catch (error) {
    console.error("Error fetching customer referral:", error);
    return null;
  }
}

/**
 * Fetch active ads (using dummy data for now)
 */
export async function fetchActiveAds(): Promise<AdConfig[]> {
  // In production, this would fetch from a database
  // For now, return dummy ads
  const now = new Date();
  return DUMMY_ADS.filter((ad) => {
    if (!ad.isActive) return false;
    if (ad.startDate && now < ad.startDate) return false;
    if (ad.endDate && now > ad.endDate) return false;
    return true;
  });
}
