import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';
import { Database } from '@/types/database';

// Types for referral system
export interface ReferralSettings {
  id?: number;
  setting_name: string;
  setting_value: string;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerPoints {
  id?: number;
  customer_id: string;
  points_balance: number;
  created_at?: string;
  updated_at?: string;
}

export interface PointTransaction {
  id?: number;
  customer_id: string;
  transaction_type: 'credit' | 'debit';
  points: number;
  order_invoice_id?: string;
  related_customer_id?: string;
  description?: string;
  created_at?: string;
}

export interface CustomerPointsSummary {
  customer_id: string;
  points_balance: number;
  username: string;
  whatsapp: string;
  points_created_at?: string;
  points_updated_at?: string;
}

export interface ReferralValidationResult {
  isValid: boolean;
  referrerId?: string;
  referrerName?: string;
  message: string;
  discountAmount?: number;
}

interface ReferralStore {
  // Settings
  settings: ReferralSettings[];
  newCustomerDiscountAmount: number;
  referrerPointsPerReferral: number;
  pointToRupiahConversionRate: number;

  // Customer points
  customerPoints: CustomerPoints[];
  customerPointsSummary: CustomerPointsSummary[];
  pointTransactions: PointTransaction[];

  // Loading states
  loading: boolean;
  settingsLoading: boolean;
  pointsLoading: boolean;

  // Actions
  fetchSettings: () => Promise<void>;
  fetchCustomerPoints: () => Promise<void>;
  fetchCustomerPointsSummary: () => Promise<void>;
  fetchPointTransactions: (customerId?: string) => Promise<void>;
  validateReferralCode: (referralCode: string) => Promise<ReferralValidationResult>;
  updateSetting: (settingName: string, settingValue: string) => Promise<boolean>;
  getCustomerPointsBalance: (customerId: string) => Promise<number>;
  addPointsToCustomer: (customerId: string, points: number, description?: string, orderInvoiceId?: string, relatedCustomerId?: string) => Promise<boolean>;
  deductPointsFromCustomer: (customerId: string, points: number, description?: string, orderInvoiceId?: string) => Promise<boolean>;
  refreshData: () => Promise<void>;
}

const supabase = createClient();

export const useReferralStore = create<ReferralStore>((set, get) => ({
  // Initial state
  settings: [],
  newCustomerDiscountAmount: 5000,
  referrerPointsPerReferral: 50,
  pointToRupiahConversionRate: 100,

  customerPoints: [],
  customerPointsSummary: [],
  pointTransactions: [],

  loading: false,
  settingsLoading: false,
  pointsLoading: false,

  // Fetch all referral settings
  fetchSettings: async () => {
    set({ settingsLoading: true });
    try {
      const { data, error } = await supabase
        .from('referral_settings')
        .select('*')
        .order('setting_name');

      if (error) throw error;

      const settings = data || [];
      const newCustomerDiscount = Number(settings.find(s => s.setting_name === 'new_customer_discount_amount')?.setting_value || '5000');
      const referrerPoints = Number(settings.find(s => s.setting_name === 'referrer_points_per_referral')?.setting_value || '50');
      const conversionRate = Number(settings.find(s => s.setting_name === 'point_to_rupiah_conversion_rate')?.setting_value || '100');

      set({
        settings,
        newCustomerDiscountAmount: newCustomerDiscount,
        referrerPointsPerReferral: referrerPoints,
        pointToRupiahConversionRate: conversionRate,
      });
    } catch (error) {
    } finally {
      set({ settingsLoading: false });
    }
  },

  // Fetch customer points
  fetchCustomerPoints: async () => {
    set({ pointsLoading: true });
    try {
      const { data, error } = await supabase
        .from('customer_points')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ customerPoints: data || [] });
    } catch (error) {
    } finally {
      set({ pointsLoading: false });
    }
  },

  // Fetch customer points summary
  fetchCustomerPointsSummary: async () => {
    set({ pointsLoading: true });
    try {
      const { data, error } = await supabase
        .from('customer_points_summary')
        .select('*')
        .order('points_balance', { ascending: false });

      if (error) throw error;
      set({ customerPointsSummary: data || [] });
    } catch (error) {
    } finally {
      set({ pointsLoading: false });
    }
  },

  // Fetch point transactions
  fetchPointTransactions: async (customerId?: string) => {
    set({ pointsLoading: true });
    try {
      let query = supabase
        .from('point_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (customerId) {
        query = query.eq('customer_id', customerId);
      }

      const { data, error } = await query;

      if (error) throw error;
      set({ pointTransactions: data || [] });
    } catch (error) {
    } finally {
      set({ pointsLoading: false });
    }
  },

  // Validate referral code
  validateReferralCode: async (referralCode: string) => {
    try {
      const { data: customer, error } = await supabase
        .from('customers')
        .select('customer_id, username')
        .eq('customer_id', referralCode)
        .single();

      if (error || !customer) {
        return {
          isValid: false,
          message: 'Invalid referral code'
        };
      }

      const { newCustomerDiscountAmount } = get();

      return {
        isValid: true,
        referrerId: customer.customer_id,
        referrerName: customer.username,
        message: `Referral code applied successfully! You get a discount of Rp ${newCustomerDiscountAmount.toLocaleString('id-ID')}.`,
        discountAmount: newCustomerDiscountAmount
      };
    } catch (error) {
      return {
        isValid: false,
        message: 'Error validating referral code'
      };
    }
  },

  // Update setting
  updateSetting: async (settingName: string, settingValue: string) => {
    try {
      const { error } = await supabase.rpc('update_referral_setting', {
        p_setting_name: settingName,
        p_setting_value: settingValue
      });

      if (error) throw error;

      // Update local state
      await get().fetchSettings();

      return true;
    } catch (error) {
      return false;
    }
  },

  // Ensure customer has points record (initialize if not exists)
  ensureCustomerPointsRecord: async (customerId: string) => {
    try {
      // Use the database function for consistency
      const { data, error } = await supabase.rpc('ensure_customer_points_record', {
        p_customer_id: customerId
      });

      if (error) throw error;

      // Points record ensured successfully
      return data;
    } catch (error) {
      // Fallback to manual method if database function fails
      try {
        const { data: existingRecord, error: checkError } = await supabase
          .from('customer_points')
          .select('customer_id')
          .eq('customer_id', customerId)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }

        if (!existingRecord) {
          const { error: insertError } = await supabase
            .from('customer_points')
            .insert({
              customer_id: customerId,
              points_balance: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (insertError) throw insertError;
          // Fallback: Initialized points record successfully
        }
        return true;
      } catch (fallbackError) {
        throw error;
      }
    }
  },

  // Get customer points balance
  getCustomerPointsBalance: async (customerId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_customer_points_balance', {
        p_customer_id: customerId
      });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      return 0;
    }
  },

  // Add points to customer
  addPointsToCustomer: async (customerId: string, points: number, description?: string, orderInvoiceId?: string, relatedCustomerId?: string) => {
    try {
      const { data, error } = await supabase.rpc('add_customer_points', {
        p_customer_id: customerId,
        p_points: points,
        p_description: description,
        p_order_invoice_id: orderInvoiceId,
        p_related_customer_id: relatedCustomerId
      });

      if (error) throw error;

      // Refresh data
      await get().fetchCustomerPoints();
      await get().fetchCustomerPointsSummary();
      await get().fetchPointTransactions(customerId);

      return data || false;
    } catch (error) {
      return false;
    }
  },

  // Deduct points from customer
  deductPointsFromCustomer: async (customerId: string, points: number, description?: string, orderInvoiceId?: string) => {
    try {
      const { data, error } = await supabase.rpc('deduct_customer_points', {
        p_customer_id: customerId,
        p_points: points,
        p_description: description,
        p_order_invoice_id: orderInvoiceId
      });

      if (error) throw error;

      // Refresh data
      await get().fetchCustomerPoints();
      await get().fetchCustomerPointsSummary();
      await get().fetchPointTransactions(customerId);

      return data || false;
    } catch (error) {
      return false;
    }
  },

  // Refresh all data
  refreshData: async () => {
    set({ loading: true });
    try {
      await Promise.all([
        get().fetchSettings(),
        get().fetchCustomerPoints(),
        get().fetchCustomerPointsSummary(),
        get().fetchPointTransactions()
      ]);
    } finally {
      set({ loading: false });
    }
  }
}));

// Initialize store data
if (typeof window !== 'undefined') {
  useReferralStore.getState().refreshData();
}