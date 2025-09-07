import { createClient } from "@/utils/supabase/client";
import { create } from "zustand";

interface OrderItem {
  service: string;
  shoe_name: string;
  amount: string;
}

interface Discount {
  order_invoice_id: number;
  discount_code: string;
  discounted_amount: number;
}

interface Orders {
  customer_id: string;
  invoice_id: string;
  status: string;
  order_item: OrderItem[];
  subtotal: number;
  order_discounts?: Discount[];
  total_price: number;
  payment: string;
  created_at: string;
}

interface CustomersOrders {
  id: number;
  customer_id: string;
  username: string;
  email?: string;
  whatsapp: string;
  alamat?: string;
  orders: Orders[];
}

interface adminOrderState {
  orders: CustomersOrders[];
  isLoading: boolean;
  fetchOrder: (invoice_id?: string) => Promise<void>;
}

export const useAdminOrder = create<adminOrderState>((set) => ({
  orders: [],
  isLoading: false,
  fetchOrder: async (invoice_id?: string) => {
    const supabase = createClient();
    const selectQuery = "*, orders ( *, order_item (*), order_discounts (*))";
    try {
      set({ isLoading: true });
      const { data: orderData, error: orderError } = await supabase
        .from("customers")
        .select(selectQuery);
      if (orderError) {
        console.log(orderError);
        return;
      }
      set({ orders: orderData || [] });
      return;
    } catch (error) {
      console.log(error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
