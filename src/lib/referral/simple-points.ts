export interface SimpleCustomerPoints {
  current_balance: number;
  total_earned: number;
  total_redeemed: number;
}

export class SimplePointsService {
  // Get customer points from database
  static async getCustomerPoints(customerId: string): Promise<SimpleCustomerPoints> {
    try {
      const { createClient } = await import("@/utils/supabase/server");
      const supabase = await createClient();

      const { data: customerPoints, error } = await supabase
        .from("customer_points")
        .select("current_balance, total_earned, total_redeemed")
        .eq("customer_id", customerId)
        .single();

      if (error) {
        return {
          current_balance: 0,
          total_earned: 0,
          total_redeemed: 0
        };
      }

      return {
        current_balance: customerPoints?.current_balance || 0,
        total_earned: customerPoints?.total_earned || 0,
        total_redeemed: customerPoints?.total_redeemed || 0
      };

    } catch (error) {
      console.error("Error fetching customer points:", error);
      return {
        current_balance: 0,
        total_earned: 0,
        total_redeemed: 0
      };
    }
  }
}