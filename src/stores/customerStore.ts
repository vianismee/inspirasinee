import { createClient } from "@/utils/supabase/client";
import { create } from "zustand";
import { toast } from "sonner";
import { ICustomers, Orders } from "@/types";
import { logger } from "@/utils/client/logger";

// Interface for customer data used when creating an order
interface CustomerData extends ICustomers {
  isNew: boolean;
}

interface CustomerState {
  activeCustomer: CustomerData | null;
  prepareCustomer: (
    customerData: Omit<CustomerData, "isNew">
  ) => Promise<boolean>;
  clearCustomer: () => void;
  customers: ICustomers[];
  singleCustomer: ICustomers | null;
  isLoading: boolean;
  fetchCustomers: (customerId?: string) => Promise<void>;
  deleteCustomer: (customerId: string) => Promise<void>;
  subscribeToCustomerChanges: () => () => void;
  updateCustomer: (
    customerId: string,
    data: Partial<ICustomers>
  ) => Promise<void>;
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  activeCustomer: null,
  customers: [],
  singleCustomer: null,
  isLoading: false,

  prepareCustomer: async (customerData) => {
    const { whatsapp } = customerData;
    const supabase = createClient();

    const { data: existingCustomer, error: findError } = await supabase
      .from("customers")
      .select("*, orders(*)")
      .eq("whatsapp", whatsapp)
      .maybeSingle();

    if (findError) {
      toast.error("Gagal mencari customer.");
      return false;
    }

    if (existingCustomer) {
      // Calculate order-related fields
      const orders = existingCustomer.orders || [];
      const customerWithOrderData = {
        ...existingCustomer,
        has_orders: orders.length > 0,
        total_orders: orders.length,
        isNew: false,
      };
      set({ activeCustomer: customerWithOrderData });
      return true;
    }

    set({ activeCustomer: { ...customerData, isNew: true } });
    return true;
  },

  clearCustomer: () => set({ activeCustomer: null }),

  fetchCustomers: async (customerId?: string) => {
    set({ isLoading: true });
    const supabase = createClient();
    try {
      if (customerId) {
        // Fetch single customer with their orders
        const { data, error } = await supabase
          .from("customers")
          .select("*, orders(*, order_item(*))") // Detail pesanan
          .eq("customer_id", customerId)
          .single();

        if (error) throw error;

        const totalSpent =
          data.orders?.reduce(
            (sum: number, order: Orders) => sum + order.total_amount,
            0
          ) || 0;

        set({ singleCustomer: data ? { ...data, totalSpent } : null });
      } else {
        // Fetch all customers with their orders
        const { data, error } = await supabase
          .from("customers")
          .select("*, orders(*)")
          .order("username", { ascending: true });

        if (error) throw error;

        const customersWithTotalSpent = (data || []).map((customer) => ({
          ...customer,
          totalSpent:
            customer.orders?.reduce(
              (sum: number, order: Orders) => sum + order.total_amount,
              0
            ) || 0,
        }));
        set({ customers: customersWithTotalSpent });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Terjadi kesalahan";
      logger.error("Gagal memuat data pelanggan", { error, errorMessage }, "CustomerStore");
      toast.error(`Gagal memuat data pelanggan: ${errorMessage}`);
    } finally {
      set({ isLoading: false });
    }
  },

  deleteCustomer: async (customerId: string) => {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("customer_id", customerId);

      if (error) throw error;
      toast.success("Pelanggan berhasil dihapus.");
    } catch (error) {
      logger.error("Gagal menghapus pelanggan", { error, customerId }, "CustomerStore");
      toast.error("Gagal menghapus pelanggan.");
    }
  },

  subscribeToCustomerChanges: () => {
    const supabase = createClient();
    const schema =
      process.env.NEXT_PUBLIC_APP_ENV === "development" ? "dev" : "public";

    const channel = supabase
      .channel("customer-db-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: schema,
          table: "customers",
        },
        () => {
          get().fetchCustomers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  updateCustomer: async (customerId, dataToUpdate) => {
    const supabase = createClient();
    try {
      const { data: updatedCustomer, error } = await supabase
        .from("customers")
        .update(dataToUpdate)
        .eq("customer_id", customerId)
        .select()
        .single();

      if (error) throw error;
      toast.success(
        `Data pelanggan "${updatedCustomer.username}" berhasil diperbarui.`
      );
    } catch (error) {
      logger.error("Gagal memperbarui data pelanggan", { error, customerId, dataToUpdate }, "CustomerStore");
      toast.error("Gagal memperbarui data pelanggan.");
      throw error;
    }
  },
}));
