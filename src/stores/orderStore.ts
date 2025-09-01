import { createClient } from "@/utils/supabase/client";
import { create } from "zustand";

interface OrderItem {
  service: string;
  shoe_name: string;
  amount: string;
}

interface Orders {
  customer_id: string;
  invoice_id: string;
  step: number;
  order_item: OrderItem[];
  subtotal: number;
  discount_id?: string;
  total_price: number;
  payment: string;
  created_at: string;
}

interface OrdersState {
  orders: Orders[] | [];
  singleOrders: Orders | null;
  isLoading: boolean;
  fetchOrder: (invoice?: string) => Promise<boolean>;
  updateOrderStep: (invoice_id: string, newStep: number) => Promise<void>; // Tambahkan ini
  subscribeToOrders: () => () => void;
}

export const useOrderStore = create<OrdersState>((set, get) => ({
  orders: [],
  singleOrders: null,
  isLoading: false,

  fetchOrder: async (invoice) => {
    set({ isLoading: true });
    const supabase = createClient();
    try {
      if (invoice) {
        const { data: singleData, error: errorData } = await supabase
          .from("orders")
          .select(
            "customer_id, invoice_id, step, subtotal, discount_id, total_price, payment, created_at, order_item ( service, shoe_name, amount)"
          )
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
        .select(
          "customer_id, invoice_id, step, subtotal, discount_id, total_price, payment, created_at, order_item ( service, shoe_name, amount)"
        );
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
      // --- PERBAIKAN ---
      // Seharusnya 'false' agar loading indicator berhenti setelah selesai.
      set({ isLoading: false });
    }
  },

  // --- TAMBAHKAN FUNGSI INI ---
  updateOrderStep: async (invoice_id, newStep) => {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("orders")
        .update({ step: newStep }) // Data yang ingin diubah
        .eq("invoice_id", invoice_id); // Kondisi baris yang akan diubah

      if (error) {
        console.error("Gagal memperbarui status pesanan:", error.message);
        throw error; // Lemparkan error agar bisa ditangani di UI jika perlu
      }

      // Tidak perlu `set()` state di sini.
      // `subscribeToOrders` akan mendeteksi perubahan di database
      // dan memanggil `fetchOrder()` secara otomatis untuk menyegarkan data.
      console.log(
        `Status untuk invoice ${invoice_id} berhasil diubah menjadi ${newStep}`
      );
    } catch (error) {
      console.error("Terjadi kesalahan saat mencoba mengubah status:", error);
    }
  },

  subscribeToOrders: () => {
    const supabase = createClient();
    const channel = supabase
      .channel("order-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          // Ketika ada perubahan di tabel 'orders', panggil fetchOrder lagi
          get().fetchOrder();
        }
      )
      .subscribe();

    // Fungsi cleanup untuk berhenti mendengarkan perubahan
    return () => {
      supabase.removeChannel(channel);
    };
  },
}));
