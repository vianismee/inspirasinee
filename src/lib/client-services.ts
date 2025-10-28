import { supabase } from "@/utils/supabase/client";
import { handleClientError } from "@/utils/client-error-handler";

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

// Client-side services to replace API routes

// === CUSTOMER SERVICES ===

export const CustomerService = {
  async getCustomers(filter?: { phone?: string; email?: string }) {
    try {
      let query = supabase.from('customers').select('*');

      if (filter?.phone) {
        query = query.eq('whatsapp', filter.phone);
      }
      if (filter?.email) {
        query = query.eq('email', filter.email);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      handleClientError(error, {
        customMessage: 'Failed to fetch customers'
      });
      return [];
    }
  },

  async createCustomer(customerData: any) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert(customerData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleClientError(error, {
        customMessage: 'Failed to create customer'
      });
      return null;
    }
  },

  async searchCustomers(query: string) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .or(`username.ilike.%${query}%,email.ilike.%${query}%,whatsapp.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;
      return data;
    } catch (error) {
      handleClientError(error, {
        customMessage: 'Failed to search customers'
      });
      return [];
    }
  }
};

// === ORDER SERVICES ===

export const OrderService = {
  async getOrders(filter?: { customer_id?: string; status?: string }) {
    try {
      let query = supabase.from('orders').select('*');

      if (filter?.customer_id) {
        query = query.eq('customer_id', filter.customer_id);
      }
      if (filter?.status) {
        query = query.eq('status', filter.status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      handleClientError(error, {
        customMessage: 'Failed to fetch orders'
      });
      return [];
    }
  },

  async createOrder(orderData: any) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleClientError(error, {
        customMessage: 'Failed to create order'
      });
      return null;
    }
  },

  async updateOrder(invoiceId: string, updateData: any) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('invoice_id', invoiceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleClientError(error, {
        customMessage: 'Failed to update order'
      });
      return null;
    }
  }
};

// === ORDER ITEM SERVICES ===

export const OrderItemService = {
  async getOrderItems(invoiceId: string) {
    try {
      const { data, error } = await supabase
        .from('order_item')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('id', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      handleClientError(error, {
        customMessage: 'Failed to fetch order items'
      });
      return [];
    }
  },

  async createOrderItems(items: any[]) {
    try {
      const { data, error } = await supabase
        .from('order_item')
        .insert(items)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      handleClientError(error, {
        customMessage: 'Failed to create order items'
      });
      return [];
    }
  }
};

// === SERVICE CATALOG SERVICES ===

export const ServiceCatalogService = {
  async getServices(filter?: { category_id?: number }) {
    try {
      let query = supabase.from('service_catalog').select('*');

      if (filter?.category_id) {
        query = query.eq('category_id', filter.category_id);
      }

      const { data, error } = await query.order('name', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      handleClientError(error, {
        customMessage: 'Failed to fetch services'
      });
      return [];
    }
  },

  async createService(serviceData: any) {
    try {
      const { data, error } = await supabase
        .from('service_catalog')
        .insert(serviceData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleClientError(error, {
        customMessage: 'Failed to create service'
      });
      return null;
    }
  }
};

// === POINTS SERVICES ===

export const PointsService = {
  async getCustomerBalance(customerId: string) {
    try {
      const { data, error } = await supabase
        .from('customer_points')
        .select('current_balance, total_earned, total_redeemed')
        .eq('customer_id', customerId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      handleClientError(error, {
        customMessage: 'Failed to fetch customer balance'
      });
      return null;
    }
  },

  async addPoints(customerId: string, points: number, referenceType: string, referenceId?: string, description?: string) {
    try {
      // First get current balance
      const currentBalance = await this.getCustomerBalance(customerId);
      const newBalance = (currentBalance?.current_balance || 0) + points;

      // Update or insert customer points
      const { error: pointsError } = await supabase
        .from('customer_points')
        .upsert({
          customer_id: customerId,
          current_balance: newBalance,
          total_earned: (currentBalance?.total_earned || 0) + points,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'customer_id'
        });

      if (pointsError) throw pointsError;

      // Record transaction
      const { error: transactionError } = await supabase
        .from('points_transactions')
        .insert({
          customer_id: customerId,
          transaction_type: 'earned',
          points_change: points,
          balance_after: newBalance,
          reference_type: referenceType,
          reference_id: referenceId,
          description: description || `Points earned: ${points}`
        });

      if (transactionError) throw transactionError;

      return newBalance;
    } catch (error) {
      handleClientError(error, {
        customMessage: 'Failed to add points'
      });
      return null;
    }
  },

  async deductPoints(customerId: string, points: number, referenceType: string, referenceId?: string, description?: string) {
    try {
      // First get current balance
      const currentBalance = await this.getCustomerBalance(customerId);
      if (!currentBalance || currentBalance.current_balance < points) {
        throw new Error('Insufficient points balance');
      }

      const newBalance = currentBalance.current_balance - points;

      // Update customer points
      const { error: pointsError } = await supabase
        .from('customer_points')
        .upsert({
          customer_id: customerId,
          current_balance: newBalance,
          total_redeemed: (currentBalance.total_redeemed || 0) + points,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'customer_id'
        });

      if (pointsError) throw pointsError;

      // Record transaction
      const { error: transactionError } = await supabase
        .from('points_transactions')
        .insert({
          customer_id: customerId,
          transaction_type: 'redeemed',
          points_change: -points,
          balance_after: newBalance,
          reference_type: referenceType,
          reference_id: referenceId,
          description: description || `Points redeemed: ${points}`
        });

      if (transactionError) throw transactionError;

      return newBalance;
    } catch (error) {
      handleClientError(error, {
        customMessage: 'Failed to deduct points'
      });
      return null;
    }
  }
};

// === REFERRAL SERVICES ===

export const ReferralService = {
  async validateReferralCode(referralCode: string) {
    try {
      const { data, error } = await supabase
        .from('referral_usage')
        .select('*')
        .eq('referral_code', referralCode)
        .limit(1);

      if (error) throw error;
      return data.length > 0;
    } catch (error) {
      handleClientError(error, {
        customMessage: 'Failed to validate referral code'
      });
      return false;
    }
  },

  async recordReferralUsage(referralData: any) {
    try {
      const { data, error } = await supabase
        .from('referral_usage')
        .insert(referralData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleClientError(error, {
        customMessage: 'Failed to record referral usage'
      });
      return null;
    }
  },

  async getReferralCustomers() {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .not('referral_code', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      handleClientError(error, {
        customMessage: 'Failed to fetch referral customers'
      });
      return [];
    }
  },

  async getReferralAnalytics() {
    try {
      const { data, error } = await supabase
        .from('referral_usage')
        .select(`
          *,
          referrer_customer:customers!referral_usage_referrer_customer_id_fkey(username, email),
          referred_customer:customers!referral_usage_referred_customer_id_fkey(username, email)
        `)
        .order('used_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      handleClientError(error, {
        customMessage: 'Failed to fetch referral analytics'
      });
      return [];
    }
  }
};

// === DISCOUNT SERVICES ===

export const DiscountService = {
  async getDiscounts() {
    try {
      const { data, error } = await supabase
        .from('discount')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      handleClientError(error, {
        customMessage: 'Failed to fetch discounts'
      });
      return [];
    }
  },

  async createDiscount(discountData: any) {
    try {
      const { data, error } = await supabase
        .from('discount')
        .insert(discountData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleClientError(error, {
        customMessage: 'Failed to create discount'
      });
      return null;
    }
  }
};

// === DATABASE HEALTH SERVICES ===

export const DatabaseService = {
  async testConnection() {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('count')
        .limit(1);

      return { success: !error, error };
    } catch (error) {
      return { success: false, error };
    }
  },

  async getEnvironmentInfo() {
    return {
      environment: process.env.NEXT_PUBLIC_APP_ENV || 'unknown',
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...',
      timestamp: new Date().toISOString()
    };
  }
};