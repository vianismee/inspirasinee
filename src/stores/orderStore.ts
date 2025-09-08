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
  order_item: OrderItem[];
  subtotal: number;
  order_discounts?: Discount[];
  total_price: number;
  payment: string;
  created_at: string;
}

// <<< UBAH: Perbarui tipe data untuk fetchOrder
interface OrdersState {
  orders: Orders[];
  count: number;
  singleOrders: Orders | null;
  isLoading: boolean;
  // Opsi sekarang menjadi sebuah objek untuk fleksibilitas
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

  // <<< UBAH: Logika fetchOrder dirombak total untuk mendukung pagination
  fetchOrder: async (options = {}) => {
    set({ isLoading: true });
    // Destrukturisasi opsi dengan nilai default untuk pagination
    const { invoice, page = 1, pageSize = 10 } = options;
    const supabase = createClient();
    const selectQuery = "*, order_item (*), order_discounts(*), customers(*)";

    try {
      // 1. Logika untuk mengambil SATU order (tidak berubah)
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
        set({ singleOrders: singleData });
        return true;
      }

      // 2. Logika BARU untuk mengambil BANYAK order dengan pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from("orders")
        .select(selectQuery, { count: "exact" }) // 'exact' untuk mendapatkan total data
        .range(from, to) // Ambil data sesuai rentang halaman
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Gagal memuat data orders:", error);
        set({ orders: [], count: 0 }); // Reset jika gagal
        return false;
      }

      // Set state dengan data halaman ini dan total data keseluruhan
      set({ orders: data || [], count: count || 0 });
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

  // Fungsi subscribe sekarang kompatibel dengan fetchOrder yang baru
  subscribeToOrders: (invoice_id) => {
    const supabase = createClient();
    const channel = supabase
      .channel(`orders-realtime-channel-${invoice_id || "all"}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          // Jika ada invoice_id, hanya dengarkan perubahan pada baris itu
          filter: invoice_id ? `invoice_id=eq.${invoice_id}` : undefined,
        },
        (payload) => {
          console.log("Perubahan terdeteksi:", payload);
          // Panggil fetchOrder lagi untuk memperbarui data
          // Jika ada invoice_id, fetch data tunggal itu. Jika tidak, fetch halaman pertama.
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
