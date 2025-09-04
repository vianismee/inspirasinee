// stores/serviceCatalogStore.ts

import { createClient } from "@/utils/supabase/client";
import { create } from "zustand";

export interface ServiceCatalog {
  id: number;
  name: string;
  amount: number;
}

// Interface Discount yang sudah final, sesuai dengan skema database
export interface Discount {
  id: number;
  label: string;
  amount: number | null;
  percent: number | null;
}

interface ServiceCatalogState {
  serviceCatalog: ServiceCatalog[];
  discountOptions: Discount[]; // nama diubah menjadi 'discountOptions' agar lebih jelas
  isLoading: boolean;
  fetchCatalog: () => Promise<void>;
}

export const useServiceCatalogStore = create<ServiceCatalogState>((set) => ({
  serviceCatalog: [],
  discountOptions: [],
  isLoading: false,

  fetchCatalog: async () => {
    set({ isLoading: true });
    const supabase = createClient();
    try {
      // Mengambil data service dan discount secara bersamaan
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
}));
