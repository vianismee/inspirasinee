import { createClient } from "@/utils/supabase/client";

// Simple types for tracking
export interface SimpleOrderData {
  invoice_id: string;
  customer_id: string;
  status: string;
  total_price: number;
  subtotal: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
}

export interface SimpleOrderItem {
  id: string;
  service_name: string;
  shoe_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
}

export interface CustomerInfo {
  name?: string;
  phone?: string;
  email?: string;
}

// Simple tracking service - NO server-side processing
class SimpleTrackingService {
  private supabase = createClient();

  // Simple format validation only - NO server checks
  validateInvoiceId(invoiceId: string): boolean {
    if (!invoiceId) return false;
    // Basic validation: 6-20 characters, alphanumeric only
    return /^[A-Z0-9]{6,20}$/.test(invoiceId.toUpperCase());
  }

  // Simple single-table query - NO complex joins
  async getOrderById(invoiceId: string): Promise<SimpleOrderData | null> {
    try {
      // Validate format first
      if (!this.validateInvoiceId(invoiceId)) {
        return null;
      }

      // Ultra-simple query - NO JOINS to prevent errors
      const { data, error } = await this.supabase
        .from('orders')
        .select(`
          invoice_id,
          customer_id,
          status,
          total_price,
          subtotal,
          payment_method,
          payment_status,
          created_at,
          updated_at
        `)
        .eq('invoice_id', invoiceId)
        .eq('status', 'completed') // Only show completed orders
        .single();

      if (error) {
        console.error('Simple tracking error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Simple tracking service error:', error);
      return null;
    }
  }

  // Separate simple query for customer info - optional
  async getCustomerInfo(customerId: string): Promise<CustomerInfo | null> {
    try {
      const { data, error } = await this.supabase
        .from('customers')
        .select('name, phone, email')
        .eq('customer_id', customerId)
        .single();

      if (error) {
        console.error('Customer info error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Customer info service error:', error);
      return null;
    }
  }

  // Simple query for order items - NO complex processing
  async getOrderItems(invoiceId: string): Promise<SimpleOrderItem[]> {
    try {
      // Simple query with reasonable limit
      const { data, error } = await this.supabase
        .from('order_item')
        .select(`
          id,
          service_name,
          shoe_name,
          quantity,
          unit_price,
          total_price,
          notes
        `)
        .eq('invoice_id', invoiceId)
        .order('id', { ascending: true })
        .limit(20); // Reasonable limit to prevent memory issues

      if (error) {
        console.error('Order items error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Order items service error:', error);
      return [];
    }
  }

  // Combined order fetch with simple retry
  async getFullOrderData(invoiceId: string): Promise<{
    order: SimpleOrderData | null;
    customer: CustomerInfo | null;
    items: SimpleOrderItem[];
  }> {
    try {
      // Validate first
      if (!this.validateInvoiceId(invoiceId)) {
        return {
          order: null,
          customer: null,
          items: []
        };
      }

      // Simple sequential queries - NO complex joins
      const order = await this.getOrderById(invoiceId);

      if (!order) {
        return {
          order: null,
          customer: null,
          items: []
        };
      }

      // Optional customer info
      const customer = await this.getCustomerInfo(order.customer_id);

      // Order items
      const items = await this.getOrderItems(invoiceId);

      return {
        order,
        customer,
        items
      };
    } catch (error) {
      console.error('Full order data error:', error);
      return {
        order: null,
        customer: null,
        items: []
      };
    }
  }
}

// Export singleton instance
export const simpleTrackingService = new SimpleTrackingService();