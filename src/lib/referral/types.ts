export interface ReferralSettings {
  id: number;
  referral_discount_amount: number;
  referrer_points_earned: number;
  points_redemption_minimum: number;
  points_redemption_value: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerPoints {
  id: number;
  customer_id: string;
  current_balance: number;
  total_earned: number;
  total_redeemed: number;
  created_at: string;
  updated_at: string;
}

export interface ReferralUsage {
  id: number;
  referral_code: string;
  referrer_customer_id: string;
  referred_customer_id: string;
  order_invoice_id: string;
  discount_applied: number;
  points_awarded: number;
  used_at: string;
}

export interface PointsTransaction {
  id: number;
  customer_id: string;
  transaction_type: 'earned' | 'redeemed' | 'adjusted';
  points_change: number;
  balance_after: number;
  reference_type: 'referral' | 'redemption' | 'manual_adjustment';
  reference_id?: string;
  description?: string;
  created_at: string;
}

export interface ReferralValidationResult {
  valid: boolean;
  referrer_customer_id?: string;
  discount_amount?: number;
  points_awarded?: number;
  error?: string;
}

export interface PointsRedemptionResult {
  valid: boolean;
  discount_amount?: number;
  points_used?: number;
  new_balance?: number;
  error?: string;
}