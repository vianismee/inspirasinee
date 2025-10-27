import { createClient } from "@/utils/supabase/server";
import {
  ReferralSettings,
  CustomerPoints,
  ReferralValidationResult,
  PointsRedemptionResult,
  ReferralUsage
} from "./types";

export class ReferralService {
  private static instance: ReferralService;
  private supabase = createClient();

  static getInstance(): ReferralService {
    if (!ReferralService.instance) {
      ReferralService.instance = new ReferralService();
    }
    return ReferralService.instance;
  }

  async getReferralSettings(): Promise<ReferralSettings | null> {
    const { data, error } = await this.supabase
      .from("referral_settings")
      .select("*")
      .eq("is_active", true)
      .single();

    // Handle case where no settings exist yet
    if (error && error.code === 'PGRST116') {
      // Return default settings if none exist
      const defaultSettings: ReferralSettings = {
        id: 0,
        referral_discount_amount: 5000,
        referrer_points_earned: 10,
        points_redemption_minimum: 50,
        points_redemption_value: 100,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      return defaultSettings;
    }

    if (error) {
      console.error("Error fetching referral settings:", error);
      return null;
    }

    return data;
  }

  async validateReferralCode(
    referralCode: string,
    newCustomerId: string
  ): Promise<ReferralValidationResult> {
    try {
      // Get referral settings
      const settings = await this.getReferralSettings();
      if (!settings || !settings.is_active) {
        return {
          valid: false,
          error: "Referral system is not active"
        };
      }

      // First, check if the new customer exists
      let newCustomer;
      let newCustomerError;
      try {
        const result = await this.supabase
          .from("customers")
          .select("customer_id")
          .eq("customer_id", newCustomerId)
          .single();
        newCustomer = result.data;
        newCustomerError = result.error;
      } catch (error) {
        console.error("Error checking new customer:", error);
        newCustomerError = error as any;
      }

      if (newCustomerError || !newCustomer) {
        console.error("New customer check failed:", newCustomerError);
        return {
          valid: false,
          error: "New customer not found"
        };
      }

      // Check if referral code exists and get referrer info
      let referrer;
      let referrerError;
      try {
        const result = await this.supabase
          .from("customers")
          .select("customer_id, username, email")
          .eq("customer_id", referralCode)
          .single();
        referrer = result.data;
        referrerError = result.error;
      } catch (error) {
        console.error("Error checking referrer:", error);
        referrerError = error as any;
      }

      if (referrerError || !referrer) {
        console.error("Referrer check failed:", referrerError);
        return {
          valid: false,
          error: "Invalid referral code"
        };
      }

      // Check if new customer is trying to refer themselves
      if (referrer.customer_id === newCustomerId) {
        return {
          valid: false,
          error: "Cannot use your own referral code"
        };
      }

      // Check if this referral was already used by this customer
      const { data: existingUsage, error: usageError } = await this.supabase
        .from("referral_usage")
        .select("*")
        .eq("referral_code", referralCode)
        .eq("referred_customer_id", newCustomerId)
        .maybeSingle();

      if (usageError) {
        // Handle case where referral_usage table doesn't exist yet
        if (usageError.code === 'PGRST116') {
          // Table doesn't exist, proceed with validation
          console.warn("Referral usage table not found, proceeding without usage check");
        } else {
          console.error("Error checking referral usage:", usageError);
          return {
            valid: false,
            error: "Error validating referral code"
          };
        }
      }

      if (existingUsage) {
        return {
          valid: false,
          error: "Referral code already used"
        };
      }

      return {
        valid: true,
        referrer_customer_id: referrer.customer_id,
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

  async getCustomerPoints(customerId: string): Promise<CustomerPoints | null> {
    const { data, error } = await this.supabase
      .from("customer_points")
      .select("*")
      .eq("customer_id", customerId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error("Error fetching customer points:", error);
      return null;
    }

    return data;
  }

  async validatePointsRedemption(
    customerId: string,
    pointsToRedeem: number
  ): Promise<PointsRedemptionResult> {
    try {
      // Get referral settings
      const settings = await this.getReferralSettings();
      if (!settings || !settings.is_active) {
        return {
          valid: false,
          error: "Points system is not active"
        };
      }

      // Check if customer has enough points
      const customerPoints = await this.getCustomerPoints(customerId);
      if (!customerPoints) {
        return {
          valid: false,
          error: "Customer points not found"
        };
      }

      // Check minimum points requirement
      if (pointsToRedeem < settings.points_redemption_minimum) {
        return {
          valid: false,
          error: `Minimum ${settings.points_redemption_minimum} points required to redeem`
        };
      }

      // Check if customer has sufficient balance
      if (customerPoints.current_balance < pointsToRedeem) {
        return {
          valid: false,
          error: "Insufficient points balance"
        };
      }

      // Calculate discount amount
      const discountAmount = pointsToRedeem * settings.points_redemption_value;
      const newBalance = customerPoints.current_balance - pointsToRedeem;

      return {
        valid: true,
        discount_amount: discountAmount,
        points_used: pointsToRedeem,
        new_balance: newBalance
      };

    } catch (error) {
      console.error("Error validating points redemption:", error);
      return {
        valid: false,
        error: "Internal error validating points redemption"
      };
    }
  }

  async createCustomerPoints(customerId: string): Promise<CustomerPoints | null> {
    const { data, error } = await this.supabase
      .from("customer_points")
      .insert({
        customer_id: customerId,
        current_balance: 0,
        total_earned: 0,
        total_redeemed: 0
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating customer points:", error);
      return null;
    }

    return data;
  }

  async ensureCustomerPoints(customerId: string): Promise<CustomerPoints | null> {
    let customerPoints = await this.getCustomerPoints(customerId);

    if (!customerPoints) {
      customerPoints = await this.createCustomerPoints(customerId);
    }

    return customerPoints;
  }

  async recordReferralUsage(
    referralCode: string,
    referrerCustomerId: string,
    referredCustomerId: string,
    orderInvoiceId: string,
    discountApplied: number,
    pointsAwarded: number
  ): Promise<ReferralUsage | null> {
    try {
      // Record referral usage
      const { data: referralUsage, error: usageError } = await this.supabase
        .from("referral_usage")
        .insert({
          referral_code: referralCode,
          referrer_customer_id: referrerCustomerId,
          referred_customer_id: referredCustomerId,
          order_invoice_id: orderInvoiceId,
          discount_applied: discountApplied,
          points_awarded: pointsAwarded
        })
        .select()
        .single();

      if (usageError) {
        // Handle case where referral_usage table doesn't exist yet
        if (usageError.code === 'PGRST116' || usageError.code === '42P01') {
          // Table doesn't exist, log warning and continue
          console.warn("Referral usage table not found, referral not tracked");
        } else {
          console.error("Error recording referral usage:", usageError);
          return null;
        }
      }

      // Award points to referrer (even if usage tracking failed)
      if (pointsAwarded > 0) {
        const pointsAdded = await this.addPointsToCustomer(
          referrerCustomerId,
          pointsAwarded,
          'referral',
          orderInvoiceId,
          `Points earned from referring customer ${referredCustomerId}`
        );

        if (!pointsAdded) {
          console.warn("Failed to award points to referrer");
        }
      }

      return referralUsage;

    } catch (error) {
      console.error("Error recording referral usage:", error);
      return null;
    }
  }

  async addPointsToCustomer(
    customerId: string,
    points: number,
    referenceType: 'referral' | 'redemption' | 'manual_adjustment',
    referenceId?: string,
    description?: string
  ): Promise<boolean> {
    try {
      // Ensure customer has points record
      const customerPoints = await this.ensureCustomerPoints(customerId);
      if (!customerPoints) {
        return false;
      }

      // Calculate new balance
      const newBalance = customerPoints.current_balance + points;
      const newTotalEarned = customerPoints.total_earned + Math.max(0, points);
      const newTotalRedeemed = customerPoints.total_redeemed + Math.abs(Math.min(0, points));

      // Update customer points
      const { error: updateError } = await this.supabase
        .from("customer_points")
        .update({
          current_balance: newBalance,
          total_earned: newTotalEarned,
          total_redeemed: newTotalRedeemed,
          updated_at: new Date().toISOString()
        })
        .eq("customer_id", customerId);

      if (updateError) {
        console.error("Error updating customer points:", updateError);
        return false;
      }

      // Record transaction (non-blocking)
      try {
        const { error: transactionError } = await this.supabase
          .from("points_transactions")
          .insert({
            customer_id: customerId,
            transaction_type: points > 0 ? 'earned' : 'redeemed',
            points_change: points,
            balance_after: newBalance,
            reference_type: referenceType,
            reference_id: referenceId,
            description: description
          });

        if (transactionError) {
          // Don't fail the whole operation if transaction recording fails
          if (transactionError.code === 'PGRST116' || transactionError.code === '42P01') {
            console.warn("Points transactions table not found, transaction not recorded");
          } else {
            console.error("Error recording points transaction:", transactionError);
          }
        }
      } catch (transactionError) {
        console.error("Exception recording points transaction:", transactionError);
      }

      return true;

    } catch (error) {
      console.error("Error adding points to customer:", error);
      return false;
    }
  }
}