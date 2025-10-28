import { ReferralService } from "./service";

export interface OrderData {
  invoice_id: string;
  customer_id: string;
  subtotal: number;
  total_amount: number;
  referral_code?: string;
  points_used?: number;
  [key: string]: unknown;
}

export interface OrderProcessingResult {
  success: boolean;
  orderData: OrderData;
  referralDiscount?: number;
  pointsDiscount?: number;
  pointsAwarded?: number;
  errors?: string[];
}

export class OrderReferralIntegration {
  private referralService = ReferralService.getInstance();

  async processOrderWithReferral(
    orderData: OrderData,
    referralCode?: string,
    pointsToRedeem?: number
  ): Promise<OrderProcessingResult> {
    const result: OrderProcessingResult = {
      success: true,
      orderData: { ...orderData },
      errors: []
    };

    try {
      let totalDiscount = 0;
      let referralDiscount = 0;
      let pointsDiscount = 0;
      let pointsAwarded = 0;

      // Step 1: Process referral code (if provided)
      if (referralCode) {
        const referralResult = await this.referralService.validateReferralCode(
          referralCode,
          orderData.customer_id
        );

        if (referralResult.valid) {
          referralDiscount = referralResult.discount_amount || 0;
          totalDiscount += referralDiscount;
          pointsAwarded = referralResult.points_awarded || 0;

          // Update order data with referral info
          result.orderData.referral_code = referralCode;
          result.orderData.referral_discount_amount = referralDiscount;
          result.orderData.points_awarded = pointsAwarded;
        } else {
          result.errors!.push(referralResult.error || "Invalid referral code");
        }
      }

      // Step 2: Process points redemption (if requested)
      if (pointsToRedeem && pointsToRedeem > 0) {
        const pointsResult = await this.referralService.validatePointsRedemption(
          orderData.customer_id,
          pointsToRedeem
        );

        if (pointsResult.valid) {
          pointsDiscount = pointsResult.discount_amount || 0;
          totalDiscount += pointsDiscount;

          // Update order data with points info
          result.orderData.points_used = pointsToRedeem;
          result.orderData.points_discount_amount = pointsDiscount;
        } else {
          result.errors!.push(pointsResult.error || "Invalid points redemption");
        }
      }

      // Step 3: Calculate final total
      const finalTotal = Math.max(0, orderData.total_amount - totalDiscount);
      result.orderData.total_amount = finalTotal;

      // Step 4: Record referral usage and award points (if referral was used)
      if (referralCode && referralDiscount > 0) {
        await this.recordReferralUsage(
          referralCode!,
          orderData.customer_id,
          orderData.invoice_id,
          referralDiscount,
          pointsAwarded
        );
      }

      // Step 5: Redeem points (if points were used)
      if (pointsToRedeem && pointsDiscount > 0) {
        await this.redeemPoints(
          orderData.customer_id,
          pointsToRedeem,
          orderData.invoice_id
        );
      }

      result.referralDiscount = referralDiscount;
      result.pointsDiscount = pointsDiscount;
      result.pointsAwarded = pointsAwarded;

      if (result.errors!.length > 0) {
        result.success = false;
      }

    } catch (error) {
      console.error("Error processing order with referral:", error);
      result.success = false;
      result.errors!.push("Internal error processing order");
    }

    return result;
  }

  private async recordReferralUsage(
    referralCode: string,
    customerId: string,
    invoiceId: string,
    discountAmount: number,
    pointsAwarded: number
  ): Promise<void> {
    try {
      // Get referrer customer ID from referral code
      const referralService = ReferralService.getInstance();

      // We need to modify the ReferralService to get referrer by code
      // For now, let's assume we have the referrer ID from validation

      const referralValidation = await referralService.validateReferralCode(referralCode, customerId);

      if (referralValidation.valid && referralValidation.referrer_customer_id) {
        await referralService.recordReferralUsage(
          referralCode,
          referralValidation.referrer_customer_id,
          customerId,
          invoiceId,
          discountAmount,
          pointsAwarded
        );
      }
    } catch (error) {
      console.error("Error recording referral usage:", error);
      // Don't fail the order if referral recording fails
    }
  }

  private async redeemPoints(
    customerId: string,
    pointsToRedeem: number,
    invoiceId: string
  ): Promise<void> {
    try {
      const referralService = ReferralService.getInstance();
      await referralService.addPointsToCustomer(
        customerId,
        -pointsToRedeem, // Negative to deduct points
        'redemption',
        invoiceId,
        `Points redeemed for order ${invoiceId}`
      );
    } catch (error) {
      console.error("Error redeeming points:", error);
      // Don't fail the order if points redemption fails
    }
  }

  async rollbackOrderReferralChanges(
    orderData: OrderData,
    pointsUsed?: number,
    pointsAwarded?: number
  ): Promise<void> {
    try {
      const referralService = ReferralService.getInstance();

      // Return deducted points
      if (pointsUsed && pointsUsed > 0) {
        await referralService.addPointsToCustomer(
          orderData.customer_id,
          pointsUsed, // Positive to return points
          'manual_adjustment',
          orderData.invoice_id,
          `Points returned due to order failure: ${orderData.invoice_id}`
        );
      }

      // Remove awarded points from referrer (this would require additional logic)
      // For now, we'll log this as a manual adjustment needed
      if (pointsAwarded && pointsAwarded > 0) {
        console.warn(`Manual adjustment needed: Remove ${pointsAwarded} points from referrer for failed order ${orderData.invoice_id}`);
      }

    } catch (error) {
      console.error("Error rolling back order referral changes:", error);
    }
  }
}