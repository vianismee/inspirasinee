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
  totalCount: number;
  membershipCounts: Record<string, number>;
  fetchCustomers: (options?: { customerId?: string; page?: number; pageSize?: number; membershipLevels?: string[] }) => Promise<void>;
  fetchMembershipCounts: () => Promise<void>;
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
  totalCount: 0,
  membershipCounts: {},

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

  fetchCustomers: async (options = {}) => {
    const { customerId, page = 1, pageSize = 10, membershipLevels } = options;
    set({ isLoading: true });
    const supabase = createClient();
    try {
      if (customerId) {
        const { data, error } = await supabase
          .from("customers")
          .select("*, orders(*, order_item(*))")
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
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        const hasFilter = membershipLevels && membershipLevels.length > 0;

        // When a membership filter is active, resolve matching customer IDs first.
        // Fetch all membership rows (small table) and filter client-side to avoid
        // PostgREST two-level nested filter syntax issues.
        let filteredIds: string[] | null = null;
        if (hasFilter) {
          const { data: memberRows } = await supabase
            .from("customer_memberships")
            .select("customer_id, customer_membership_levels(name)");

          filteredIds = (memberRows || [])
            .filter((m) => {
              const name = (m.customer_membership_levels as unknown as { name: string } | null)?.name;
              return name ? membershipLevels!.includes(name) : false;
            })
            .map((m) => m.customer_id);

          if (filteredIds.length === 0) {
            set({ customers: [], totalCount: 0 });
            return;
          }
        }

        let dataQuery = supabase
          .from("customers")
          .select("*, orders(*), customer_memberships(membership_level_id, customer_membership_levels(name, level_index))")
          .order("username", { ascending: true })
          .range(from, to);

        let countQuery = supabase
          .from("customers")
          .select("*", { count: "exact", head: true });

        if (filteredIds) {
          dataQuery = dataQuery.in("customer_id", filteredIds);
          countQuery = countQuery.in("customer_id", filteredIds);
        }

        const [{ data, error }, { count: totalCount, error: countError }] =
          await Promise.all([dataQuery, countQuery]);

        if (error) throw error;
        if (countError) logger.warn("Could not get total count", { error: countError }, "CustomerStore");

        const customersWithTotalSpent = (data || []).map((customer) => ({
          ...customer,
          totalSpent:
            customer.orders?.reduce(
              (sum: number, order: Orders) => sum + order.total_price,
              0
            ) || 0,
        }));

        set({
          customers: customersWithTotalSpent,
          totalCount: totalCount || 0,
        });
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

  fetchMembershipCounts: async () => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("customer_memberships")
        .select("customer_membership_levels(name)");

      if (error) throw error;

      const counts = (data || []).reduce<Record<string, number>>((acc, row) => {
        // PostgREST returns the nested relation; cast via unknown to avoid TS overlap error
        const level = row.customer_membership_levels as unknown as { name: string } | null;
        const name = level?.name;
        if (name) acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {});

      set({ membershipCounts: counts });
    } catch (error) {
      logger.warn("Could not fetch membership counts", { error }, "CustomerStore");
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

    const channel = supabase
      .channel("customer-db-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
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
