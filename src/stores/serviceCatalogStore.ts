import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { create } from "zustand";

export interface ServiceCatalog {
  id: number;
  name: string;
  amount: number;
  service_category: Category | null;
}

export interface Discount {
  id: number;
  label: string;
  amount: number | null;
  percent: number | null;
}

export interface Category {
  id: number;
  name: string;
}

interface ServiceCatalogState {
  serviceCatalog: ServiceCatalog[];
  discountOptions: Discount[];
  serviceCategory: Category[];
  isLoading: boolean;
  fetchCatalog: () => Promise<void>;
  updateService: (
    serviceId: number,
    data: { name: string; amount: number; category_id: number }
  ) => Promise<void>;
  deleteService: (serviceId: number) => Promise<void>;
  subscribeToChanges: () => () => void;
}

export const useServiceCatalogStore = create<ServiceCatalogState>(
  (set, get) => ({
    serviceCatalog: [],
    discountOptions: [],
    serviceCategory: [],
    isLoading: false,

    fetchCatalog: async () => {
      set({ isLoading: true });
      const supabase = createClient();
      try {
        const [
          { data: serviceData, error: serviceError },
          { data: discountData, error: discountError },
          { data: categoryData, error: categoryError },
        ] = await Promise.all([
          // Query kembali mengambil semua data service dengan relasinya
          supabase
            .from("service_catalog")
            .select("*, service_category(*)")
            .order("name", { ascending: true }),
          supabase.from("discount").select("*"),
          supabase.from("service_category").select("*"),
        ]);

        if (serviceError) throw serviceError;
        if (discountError) throw discountError;
        if (categoryError) throw categoryError;

        set({
          serviceCatalog: serviceData || [],
          discountOptions: discountData || [],
          serviceCategory: categoryData || [],
        });
      } catch (error) {
        console.error("Gagal memuat data katalog:", error);
        toast.error("Gagal memuat data katalog.");
      } finally {
        set({ isLoading: false });
      }
    },

    updateService: async (serviceId, dataToUpdate) => {
      const supabase = createClient();
      try {
        const { error } = await supabase
          .from("service_catalog")
          .update(dataToUpdate)
          .eq("id", serviceId);

        if (error) throw error;

        toast.success("Layanan berhasil diperbarui.");
        get().fetchCatalog(); // Panggil fetch ulang untuk sinkronisasi
      } catch (error) {
        console.error("Gagal memperbarui service:", error);
        toast.error("Gagal memperbarui layanan.");
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

        toast.success("Layanan berhasil dihapus.");
        // Cukup filter state di client, tidak perlu fetch ulang semua data
        set((state) => ({
          serviceCatalog: state.serviceCatalog.filter(
            (s) => s.id !== serviceId
          ),
        }));
      } catch (error) {
        console.error("Gagal menghapus service:", error);
        toast.error("Gagal menghapus layanan.");
      }
    },

    subscribeToChanges: () => {
      const supabase = createClient();
      // Saat ada perubahan, fetch ulang semua data
      const refreshData = () => get().fetchCatalog();

      const serviceChannel = supabase
        .channel("service_catalog_changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "service_catalog" },
          refreshData
        )
        .subscribe();

      const categoryChannel = supabase
        .channel("service_category_changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "service_category" },
          refreshData
        )
        .subscribe();

      const discountChannel = supabase
        .channel("discount_changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "discount" },
          refreshData
        )
        .subscribe();

      return () => {
        supabase.removeChannel(serviceChannel);
        supabase.removeChannel(categoryChannel);
        supabase.removeChannel(discountChannel);
      };
    },
  })
);
