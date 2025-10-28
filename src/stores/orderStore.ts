import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { create } from "zustand";

// 1. Definisikan tipe data baru untuk hasil grouping
interface ServiceDetail {
  service: string;
  amount: string;
}

interface GroupedOrderItem {
  shoe_name: string;
  services: ServiceDetail[];
}

// Tipe data `OrderItem` asli dari database (tidak diubah)
interface OrderItem {
  service: string;
  shoe_name: string;
  amount: string;
}

// 2. Buat fungsi helper untuk mengelompokkan data
const groupOrderItems = (items: OrderItem[]): GroupedOrderItem[] => {
  if (!items || items.length === 0) {
    return [];
  }

  const grouped = items.reduce((acc, item) => {
    if (!acc[item.shoe_name]) {
      acc[item.shoe_name] = [];
    }
    acc[item.shoe_name].push({
      service: item.service,
      amount: item.amount,
    });
    return acc;
  }, {} as Record<string, ServiceDetail[]>);

  return Object.entries(grouped).map(([shoe_name, services]) => ({
    shoe_name,
    services,
  }));
};

interface Discount {
  order_invoice_id: number;
  discount_code: string;
  discounted_amount: number;
}

interface Customers {
  customer_id: string;
  username: string;
  whatsapp: string;
  alamat?: string;
  email?: string;
}

interface Orders {
  customer_id: string;
  customers: Customers;
  invoice_id: string;
  status: string;
  order_item: GroupedOrderItem[]; // Tipe data diubah menjadi hasil grouping
  subtotal: number;
  order_discounts?: Discount[];
  total_amount: number;
  payment: string;
  created_at: string;
}

interface OrdersState {
  orders: Orders[];
  count: number;
  singleOrders: Orders | null;
  isLoading: boolean;
  fetchOrder: (options?: {
    invoice?: string;
    page?: number;
    pageSize?: number;
  }) => Promise<boolean>;
  updateOrderStep: (invoice_id: string, newStep: string) => Promise<void>;
  deleteInvoice: (invoice_id: string) => Promise<void>;
  updatePayment: (invoice_id: string, newPayment: string) => Promise<void>;
  subscribeToOrders: (invoice_id?: string) => () => void;
}

export const useOrderStore = create<OrdersState>((set, get) => ({
  orders: [],
  singleOrders: null,
  isLoading: false,
  count: 0,

  fetchOrder: async (options = {}) => {
    set({ isLoading: true });
    const { invoice, page = 1, pageSize = 10 } = options;
    const supabase = createClient();
    const selectQuery = "*, order_item (*), order_discounts(*), customers(*)";

    try {
      if (invoice) {
        const { data: singleData, error: errorData } = await supabase
          .from("orders")
          .select(selectQuery)
          .eq("invoice_id", invoice)
          .single();

        if (errorData) {
          console.error("Gagal memuat data order tunggal:", errorData);
          set({ singleOrders: null });
          return false;
        }

        // 3. Lakukan grouping SEBELUM menyimpan ke state
        const groupedItems = groupOrderItems(
          singleData.order_item as OrderItem[]
        );
        const processedData = { ...singleData, order_item: groupedItems };

        set({ singleOrders: processedData });
        return true;
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from("orders")
        .select(selectQuery, { count: "exact" })
        .range(from, to)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Gagal memuat data orders:", error);
        set({ orders: [], count: 0 });
        return false;
      }

      // 3. Lakukan grouping untuk setiap order SEBELUM menyimpan ke state
      const processedData = (data || []).map((order) => ({
        ...order,
        order_item: groupOrderItems(order.order_item as OrderItem[]),
      }));

      set({ orders: processedData as Orders[], count: count || 0 });
      return true;
    } catch (error) {
      console.error("Terjadi kesalahan pada fetchOrder:", error);
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
        throw error;
      }
      toast.success(
        `Status untuk invoice ${invoice_id} berhasil diubah menjadi ${newStep}`
      );
    } catch (error) {
      const errorMessage = (error as Error).message;
      toast.error(`Gagal mengubah status: ${errorMessage}`);
      console.error("Terjadi kesalahan saat mencoba mengubah status:", error);
    }
  },

  subscribeToOrders: (invoice_id) => {
    const supabase = createClient();
    // TAMBAHKAN BARIS INI
    const schema =
      process.env.NEXT_PUBLIC_APP_ENV === "development" ? "dev" : "public";

    const channel = supabase
      .channel(`orders-realtime-channel-${invoice_id || "all"}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: schema, // UBAH INI
          table: "orders",
          filter: invoice_id ? `invoice_id=eq.${invoice_id}` : undefined,
        },
        () => {
          get().fetchOrder({ invoice: invoice_id });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  deleteInvoice: async (invoice_id) => {
    const supabase = createClient();

    try {
      // First delete related referral_usage records (if any)
      const { error: referralError } = await supabase
        .from("referral_usage")
        .delete()
        .eq("order_invoice_id", invoice_id);

      if (referralError) {
        console.warn("Warning: Could not delete referral usage records:", referralError);
        // Continue with order deletion even if referral deletion fails
      }

      // Also delete related order_items records
      const { error: itemsError } = await supabase
        .from("order_items")
        .delete()
        .eq("invoice_id", invoice_id);

      if (itemsError) {
        console.warn("Warning: Could not delete order items:", itemsError);
        // Continue with order deletion even if items deletion fails
      }

      // Now delete the order
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("invoice_id", invoice_id);

      if (error) {
        console.error(error);
        toast.error("Gagal Menghapus data");
        return;
      }

      toast.success(`Berhasil menghapus Invoice ${invoice_id}`);
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast.error("Terjadi kesalahan saat menghapus data");
    }
  },

  updatePayment: async (invoice_id, newPayment) => {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("orders")
        .update({ payment: newPayment })
        .eq("invoice_id", invoice_id);
      if (error) {
        throw error;
      }
      toast.success(
        `Status Pembayaran Invoice ${invoice_id} berhasil diubah menjadi ${newPayment}`
      );
    } catch (error) {
      const errorMessage = (error as Error).message;
      toast.error(`Gagal mengubah pembayaran: ${errorMessage}`);
    }
  },
}));
