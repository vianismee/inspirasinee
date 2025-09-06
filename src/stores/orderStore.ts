import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
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

interface OrdersState {
  orders: Orders[] | [];
  singleOrders: Orders | null;
  isLoading: boolean;
  fetchOrder: (invoice?: string) => Promise<boolean>;
  updateOrderStep: (invoice_id: string, newStep: string) => Promise<void>;
  deleteInvoice: (invoice_id: string) => Promise<void>;
  subscribeToOrders: (invoice_id?: string) => () => void;
}

export const useOrderStore = create<OrdersState>((set, get) => ({
  orders: [],
  singleOrders: null,
  isLoading: false,

  fetchOrder: async (invoice) => {
    set({ isLoading: true });
    const supabase = createClient();
    const selectQuery = "*, order_item (*), order_discounts(*)";
    try {
      if (invoice) {
        const { data: singleData, error: errorData } = await supabase
          .from("orders")
          .select(selectQuery)
          .eq("invoice_id", invoice)
          .single();
        if (errorData) {
          console.log("Gagal memuat data", errorData);
          return false;
        }
        set({ singleOrders: singleData });
        return true;
      }

      const { data: orderData, error: errorData } = await supabase
        .from("orders")
        .select(selectQuery);
      if (errorData) {
        console.log(errorData);
        return false;
      }
      set({ orders: orderData || [] });
      return true;
    } catch (error) {
      console.log(error);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  updateOrderStep: async (invoice_id, newStep) => {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStep })
        .eq("invoice_id", invoice_id);

      if (error) {
        console.error("Gagal memperbarui status pesanan:", error.message);
        throw error;
      }

      console.log(
        `Status untuk invoice ${invoice_id} berhasil diubah menjadi ${newStep}`
      );
    } catch (error) {
      console.error("Terjadi kesalahan saat mencoba mengubah status:", error);
    }
  },

  subscribeToOrders: (invoice_id) => {
    const supabase = createClient();
    let channel;
    if (invoice_id) {
      channel = supabase
        .channel(`order-channel-${invoice_id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "orders",
            filter: `invoice_id=eq.${invoice_id}`,
          },
          () => {
            get().fetchOrder(invoice_id);
          }
        )
        .subscribe();
    } else {
      channel = supabase
        .channel("orders-channel-all")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
          },
          () => {
            get().fetchOrder();
          }
        )
        .subscribe();
    }

    return () => {
      supabase.removeChannel(channel);
    };
  },

  deleteInvoice: async (invoice_id) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("orders")
      .delete()
      .eq("invoice_id", invoice_id);
    if (error) {
      console.log(error);
      toast.error("Gagal Menghapus data");
      return;
    }
    toast.success(`Berhasil mnghapus Invoice ${invoice_id}`);
  },
}));
