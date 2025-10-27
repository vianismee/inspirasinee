import { createClient } from "@/utils/supabase/server";

export interface SimpleReferralValidationResult {
  valid: boolean;
  referrer_customer_id?: string;
  discount_amount?: number;
  points_awarded?: number;
  error?: string;
}

export interface SimplePointsRedemptionResult {
  valid: boolean;
  discount_amount?: number;
  points_used?: number;
  new_balance?: number;
  error?: string;
}

export class SimpleReferralService {
  private static instance: SimpleReferralService;

  static getInstance(): SimpleReferralService {
    if (!SimpleReferralService.instance) {
      SimpleReferralService.instance = new SimpleReferralService();
    }
    return SimpleReferralService.instance;
  }

  private async getSupabase() {
    return await createClient();
  }

  async validateReferralCode(
    referralCode: string,
    newCustomerId: string
  ): Promise<SimpleReferralValidationResult> {
    try {
      // Get Supabase client
      const supabase = await this.getSupabase();

      // Try to fetch settings from database, fall back to defaults if table doesn't exist
      let settings = {
        referral_discount_amount: 5000,
        referrer_points_earned: 10,
        points_redemption_minimum: 50,
        points_redemption_value: 100,
        is_active: true
      };

      try {
        const { data: dbSettings } = await supabase
          .from("referral_settings")
          .select("*")
          .eq("id", 1)
          .single();

        if (dbSettings) {
          console.log("Using database settings:", dbSettings);
          settings = {
            referral_discount_amount: dbSettings.referral_discount_amount || 5000,
            referrer_points_earned: dbSettings.referrer_points_earned || 10,
            points_redemption_minimum: dbSettings.points_redemption_minimum || 50,
            points_redemption_value: dbSettings.points_redemption_value || 100,
            is_active: dbSettings.is_active !== false
          };
        } else {
          console.log("No settings found in database, using defaults");
        }
      } catch (error) {
        console.warn("Referral settings table not found, using default settings:", error);
      }

      // Check if both customers exist (simple validation)
      let referrerExists = false;
      let newCustomerExists = false;

      // Check new customer
      try {
        console.log("Looking up new customer with ID:", newCustomerId);
        const { data: newCustomer, error } = await supabase
          .from("customers")
          .select("customer_id")
          .eq("customer_id", newCustomerId)
          .single();

        console.log("New customer query result:", { data: newCustomer, error });

        if (newCustomer) {
          newCustomerExists = true;
          console.log("New customer found:", newCustomer);
        } else {
          console.log("New customer not found. Error details:", error);
        }
      } catch (error) {
        console.error("Error checking new customer:", error);
      }

      // Check referrer
      try {
        console.log("Looking up referrer with ID:", referralCode);
        const { data: referrer, error } = await supabase
          .from("customers")
          .select("customer_id")
          .eq("customer_id", referralCode)
          .single();

        console.log("Referrer query result:", { data: referrer, error });

        if (referrer) {
          referrerExists = true;
          console.log("Referrer found:", referrer);
        } else {
          console.log("Referrer not found. Error details:", error);
        }
      } catch (error) {
        console.error("Error checking referrer:", error);
      }

      // Validate basic requirements
      // For new customers: Don't require the customer to exist in database yet
      // The customer will be added to database when order is successful
      console.log("Customer validation:", {
        newCustomerExists,
        referrerExists,
        newCustomerId,
        referralCode
      });

      if (!referrerExists) {
        return {
          valid: false,
          error: "Invalid referral code"
        };
      }

      // Note: We don't check if newCustomerExists anymore because
      // new customers are only added to database after successful order

      if (referralCode === newCustomerId) {
        return {
          valid: false,
          error: "Cannot use your own referral code"
        };
      }

      // For new customers, skip the referral usage check since they don't exist in database yet
      // The referral usage will be recorded when the order is successfully processed
      console.log("Skipping referral usage check for new customer (will be recorded after successful order)");

      return {
        valid: true,
        referrer_customer_id: referralCode,
        discount_amount: settings.referral_discount_amount,
        points_awarded: settings.referrer_points_earned
      };

    } catch (error) {
      console.error("Error validating referral code:", error);
      return {
        valid: false,
        error: "Internal error validating referral code"
      };
    }
  }

  async validatePointsRedemption(
    customerId: string,
    pointsToRedeem: number
  ): Promise<SimplePointsRedemptionResult> {
    try {
      // Get Supabase client
      const supabase = await this.getSupabase();

      // Try to fetch settings from database
      let settings = {
        points_redemption_minimum: 50,
        points_redemption_value: 100,
        is_active: true
      };

      try {
        const { data: dbSettings } = await supabase
          .from("referral_settings")
          .select("*")
          .eq("id", 1)
          .single();

        if (dbSettings) {
          settings = {
            points_redemption_minimum: dbSettings.points_redemption_minimum || 50,
            points_redemption_value: dbSettings.points_redemption_value || 100,
            is_active: dbSettings.is_active !== false
          };
        }
      } catch (error) {
        console.warn("Referral settings table not found, using default settings:", error);
      }

      // Validate minimum points requirement
      if (pointsToRedeem < settings.points_redemption_minimum) {
        return {
          valid: false,
          error: `Minimum ${settings.points_redemption_minimum} points required to redeem`
        };
      }

      // Calculate discount amount
      const discountAmount = pointsToRedeem * settings.points_redemption_value;

      return {
        valid: true,
        discount_amount: discountAmount,
        points_used: pointsToRedeem,
        new_balance: 0 // Simplified - we don't track actual balance yet
      };

    } catch (error) {
      console.error("Error validating points redemption:", error);
      return {
        valid: false,
        error: "Internal error validating points redemption"
      };
    }
  }

  // Method to record referral usage after successful transaction
  async recordReferralUsage(
    referralCode: string,
    newCustomerId: string,
    orderInvoiceId: string,
    pointsUsed?: number,
    pointsDiscount?: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = await this.getSupabase();

      // Get current settings for points awarding
      let settings = {
        referrer_points_earned: 10,
        referral_discount_amount: 5000
      };

      try {
        const { data: dbSettings } = await supabase
          .from("referral_settings")
          .select("*")
          .eq("id", 1)
          .single();

        if (dbSettings) {
          settings = {
            referrer_points_earned: dbSettings.referrer_points_earned || 10,
            referral_discount_amount: dbSettings.referral_discount_amount || 5000
          };
        }
      } catch (error) {
        console.warn("Could not fetch referral settings, using defaults:", error);
      }

      // Add customer to customers table first (in case they don't exist)
      try {
        await supabase
          .from("customers")
          .insert({
            customer_id: newCustomerId,
            created_at: new Date().toISOString()
          });
        console.log("New customer added to database:", newCustomerId);
      } catch (error) {
        console.warn("Customer might already exist or insert failed:", error);
      }

      // Record referral usage
      try {
        const { error } = await supabase
          .from("referral_usage")
          .insert({
            referral_code: referralCode,
            referrer_customer_id: referralCode,
            referred_customer_id: newCustomerId,
            order_invoice_id: orderInvoiceId,
            discount_applied: settings.referral_discount_amount,
            points_awarded: settings.referrer_points_earned,
            used_at: new Date().toISOString()
          });

        if (error) {
          console.error("Error recording referral usage:", error);
          return { success: false, error: error.message };
        }

        console.log("Referral usage recorded successfully");
      } catch (error) {
        console.error("Error in referral_usage table:", error);
        return { success: false, error: "Failed to record referral usage" };
      }

      // Award points to referrer
      try {
        // Get or create customer_points record for referrer
        const { data: referrerPoints, error: fetchError } = await supabase
          .from("customer_points")
          .select("*")
          .eq("customer_id", referralCode)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error("Error fetching referrer points:", fetchError);
        }

        let newBalance;
        if (referrerPoints) {
          // Update existing points
          newBalance = (referrerPoints.current_balance || 0) + settings.referrer_points_earned;
          await supabase
            .from("customer_points")
            .update({
              current_balance: newBalance,
              total_earned: (referrerPoints.total_earned || 0) + settings.referrer_points_earned,
              updated_at: new Date().toISOString()
            })
            .eq("customer_id", referralCode);
        } else {
          // Create new points record
          newBalance = settings.referrer_points_earned;
          await supabase
            .from("customer_points")
            .insert({
              customer_id: referralCode,
              current_balance: settings.referrer_points_earned,
              total_earned: settings.referrer_points_earned,
              total_redeemed: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
        }

        // Record points transaction
        await supabase
          .from("points_transactions")
          .insert({
            customer_id: referralCode,
            transaction_type: "earned",
            points_change: settings.referrer_points_earned,
            balance_after: newBalance,
            reference_type: "referral",
            reference_id: orderInvoiceId,
            description: `Referral bonus from customer ${newCustomerId}`,
            created_at: new Date().toISOString()
          });

        console.log(`Awarded ${settings.referrer_points_earned} points to referrer ${referralCode}`);
      } catch (error) {
        console.error("Error awarding points to referrer:", error);
        // Don't fail the whole operation if points awarding fails
      }

      // Deduct points from new customer if they used points
      if (pointsUsed && pointsUsed > 0) {
        try {
          console.log(`Deducting ${pointsUsed} points from customer ${newCustomerId}`);

          const { success: deductSuccess, error: deductError } = await this.deductPoints(
            newCustomerId,
            pointsUsed,
            orderInvoiceId
          );

          if (!deductSuccess) {
            console.error("Failed to deduct points:", deductError);
            // Don't fail the whole operation, but log the error
          } else {
            console.log(`Successfully deducted ${pointsUsed} points from customer ${newCustomerId}`);
          }
        } catch (error) {
          console.error("Error deducting points from customer:", error);
          // Don't fail the whole operation, but log the error
        }
      }

      return { success: true };

    } catch (error) {
      console.error("Error in recordReferralUsage:", error);
      return { success: false, error: "Internal error recording referral usage" };
    }
  }

  // Method to deduct points after successful transaction
  async deductPoints(
    customerId: string,
    pointsToDeduct: number,
    orderId: string
  ): Promise<{ success: boolean; error?: string; newBalance?: number }> {
    try {
      const supabase = await this.getSupabase();

      if (pointsToDeduct <= 0) {
        return { success: true, newBalance: 0 }; // No points to deduct
      }

      // Get current customer points
      const { data: currentPoints, error: fetchError } = await supabase
        .from("customer_points")
        .select("*")
        .eq("customer_id", customerId)
        .single();

      if (fetchError) {
        console.error("Error fetching customer points for deduction:", fetchError);
        return { success: false, error: "Failed to fetch customer points" };
      }

      if (!currentPoints) {
        return { success: false, error: "Customer has no points record" };
      }

      if (currentPoints.current_balance < pointsToDeduct) {
        return { success: false, error: "Insufficient points balance" };
      }

      // Calculate new balance
      const newBalance = currentPoints.current_balance - pointsToDeduct;
      const newTotalRedeemed = (currentPoints.total_redeemed || 0) + pointsToDeduct;

      // Update customer points
      const { error: updateError } = await supabase
        .from("customer_points")
        .update({
          current_balance: newBalance,
          total_redeemed: newTotalRedeemed,
          updated_at: new Date().toISOString()
        })
        .eq("customer_id", customerId);

      if (updateError) {
        console.error("Error updating customer points:", updateError);
        return { success: false, error: "Failed to update points" };
      }

      // Record points transaction
      await supabase
        .from("points_transactions")
        .insert({
          customer_id: customerId,
          transaction_type: "redeemed",
          points_change: -pointsToDeduct, // Negative for redemption
          balance_after: newBalance,
          reference_type: "redemption",
          reference_id: orderId,
          description: `Points redeemed for order ${orderId}`,
          created_at: new Date().toISOString()
        });

      console.log(`Successfully deducted ${pointsToDeduct} points from customer ${customerId}. New balance: ${newBalance}`);

      return { success: true, newBalance };

    } catch (error) {
      console.error("Error deducting points:", error);
      return { success: false, error: "Internal error deducting points" };
    }
  }
}