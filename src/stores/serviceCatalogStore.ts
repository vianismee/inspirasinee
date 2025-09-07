import { createClient } from "@/utils/supabase/client";
import { create } from "zustand";

export interface ServiceCatalog {
  id: number;
  name: string;
  amount: number;
}

export interface Discount {
  id: number;
  label: string;
  amount: number | null;
  percent: number | null;
}

interface ServiceCatalogState {
  serviceCatalog: ServiceCatalog[];
  discountOptions: Discount[];
  isLoading: boolean;
  fetchCatalog: () => Promise<void>;
  deleteService: (serviceId: number) => Promise<void>;
  subscribeService: () => () => void;
}

export const useServiceCatalogStore = create<ServiceCatalogState>(
  (set, get) => ({
    serviceCatalog: [],
    discountOptions: [],
    isLoading: false,

    fetchCatalog: async () => {
      set({ isLoading: true });
      const supabase = createClient();
      try {
        const [serviceRes, discountRes] = await Promise.all([
          supabase.from("service_catalog").select("*"),
          supabase.from("discount").select("*"),
        ]);

        if (serviceRes.error) throw serviceRes.error;
        if (discountRes.error) throw discountRes.error;

        set({
          serviceCatalog: serviceRes.data || [],
          discountOptions: discountRes.data || [],
        });
      } catch (error) {
        console.error("Gagal memuat data katalog:", error);
      } finally {
        set({ isLoading: false });
      }
    },

    deleteService: async (serviceId: number) => {
      const supabase = createClient();
      try {
        const { error } = await supabase
          .from("service_catalog")
          .delete()
          .eq("id", serviceId);

        if (error) throw error;

        set({
          serviceCatalog: get().serviceCatalog.filter(
            (s) => s.id !== serviceId
          ),
        });
      } catch (error) {
        console.error("Gagal menghapus service:", error);
      }
    },

    subscribeService: () => {
      const supabase = createClient();
      const channel = supabase
        .channel("service_catalog_changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "service_catalog" },
          () => {
            get().fetchCatalog();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    },
  })
);
