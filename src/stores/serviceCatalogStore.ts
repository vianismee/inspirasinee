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
  code: string;
  amount: number;
}

interface ServiceCatalogState {
  serviceCatalog: ServiceCatalog[];
  discountOption: Discount[];
  isLoading: boolean;
  fetchCatalog: () => Promise<void>;
  deleteService: (id: number) => Promise<void>;
  subscribeService: () => () => void;
}

export const useServiceCatalogStore = create<ServiceCatalogState>(
  (set, get) => ({
    serviceCatalog: [],
    discountOption: [],
    isLoading: false,
    fetchCatalog: async () => {
      set({ isLoading: true });
      const supabase = createClient();
      try {
        const [serviceRest, discountRes] = await Promise.all([
          supabase.from("service_catalog").select("*"),
          supabase.from("discount").select("*"),
        ]);

        if (serviceRest.error) throw serviceRest.error;
        if (discountRes.error) throw discountRes.error;
        set({
          serviceCatalog: serviceRest.data || [],
          discountOption: discountRes.data || [],
        });
      } catch (error) {
        console.log("Gagal Memuat data", error);
      } finally {
        set({ isLoading: false });
      }
    },

    deleteService: async (id) => {
      const supabase = createClient();
      set({ isLoading: true });
      try {
        const { error } = await supabase
          .from("service_catalog")
          .delete()
          .eq("id", id);
        if (error) {
          console.log(error);
          return;
        }
        return;
      } catch (error) {
        console.log(error);
      } finally {
        set({ isLoading: false });
      }
    },

    subscribeService: () => {
      const supabase = createClient();

      const channel = supabase
        .channel("service-channel-all")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "service_catalog",
          },
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
