import { createClient } from "@/utils/supabase/client";
import { create } from "zustand";
import { toast } from "sonner";
import { ICustomers, Orders } from "@/types";
import { useReferralStore } from "./referralStore";

// Interface for customer data used when creating an order
interface CustomerData extends ICustomers {
  isNew: boolean;
  referralCode?: string;
  referralCodeValid?: boolean;
  referralDiscountAmount?: number;
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
      .select("*")
      .eq("whatsapp", whatsapp)
      .maybeSingle();

    if (findError) {
      toast.error("Gagal mencari customer.");
      return false;
    }

    if (existingCustomer) {
      set({ activeCustomer: { ...existingCustomer, isNew: false } });
      return true;
    }

    set({ activeCustomer: { ...customerData, isNew: true } });
    return true;
  },

  // Update customer with referral data (called from CartApp)
  updateCustomerReferralData: (referralData: {
    referralCode?: string;
    referralCodeValid?: boolean;
    referralDiscountAmount?: number;
  }) => {
    set((state) => ({
      activeCustomer: state.activeCustomer
        ? { ...state.activeCustomer, ...referralData }
        : null,
    }));
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
            (sum: number, order: Orders) => sum + order.total_price,
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
              (sum: number, order: Orders) => sum + order.total_price,
              0
            ) || 0,
        }));
        set({ customers: customersWithTotalSpent });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Terjadi kesalahan";
      toast.error(`Gagal memuat data pelanggan: ${errorMessage}`);
    } finally {
      set({ isLoading: false });
    }
  },

  deleteCustomer: async (customerId: string) => {
    const supabase = createClient();
    try {
      // Use the database function to safely delete customer and all related data
      const { data, error } = await supabase.rpc('delete_customer_safely', {
        p_customer_id: customerId
      });

      if (error) throw error;

      if (data) {
        toast.success("Pelanggan dan semua data terkait berhasil dihapus.");

        // Refresh customer list
        await get().fetchCustomers();
      } else {
        throw new Error("Gagal menghapus pelanggan.");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan";
      toast.error(`Gagal menghapus pelanggan: ${errorMessage}`);
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
      toast.error("Gagal memperbarui data pelanggan.");
      throw error;
    }
  },
}));
