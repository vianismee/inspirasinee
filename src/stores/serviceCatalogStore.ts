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
export interface DiscountFormData {
  label: string;
  amount?: number | null;
  percent?: number | null;
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
  addDiscount: (data: DiscountFormData) => Promise<void>;
  updateDiscount: (discountId: number, data: DiscountFormData) => Promise<void>;
  deleteDiscount: (discountId: number) => Promise<void>;
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
          supabase
            .from("service_catalog")
            .select("*, service_category(*)")
            .order("name", { ascending: true }),
          supabase.from("discount").select("*"),
          supabase
            .from("service_category")
            .select("*")
            .order("name", { ascending: true }),
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

        // Optimistic Update: Perbarui state lokal tanpa perlu fetch ulang
        set((state) => {
          const updatedCatalog = state.serviceCatalog.map((service) => {
            if (service.id === serviceId) {
              const category =
                state.serviceCategory.find(
                  (cat) => cat.id === dataToUpdate.category_id
                ) || null;
              return {
                ...service,
                ...dataToUpdate,
                service_category: category,
              };
            }
            return service;
          });
          return { serviceCatalog: updatedCatalog };
        });
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

        // Optimistic Update: Hapus dari state lokal
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

      // ✅ Fungsi cleanup yang sudah diperbaiki
      return () => {
        supabase.removeChannel(serviceChannel);
        supabase.removeChannel(categoryChannel);
        supabase.removeChannel(discountChannel);
      };
    },

    addDiscount: async (data) => {
      const supabase = createClient();
      try {
        const { data: newDiscount, error } = await supabase
          .from("discount")
          .insert(data)
          .select()
          .single();

        if (error) throw error;
        toast.success(`Diskon "${newDiscount.label}" berhasil ditambahkan.`);

        // Optimistic update
        set((state) => ({
          discountOptions: [...state.discountOptions, newDiscount].sort(
            (a, b) => a.label.localeCompare(b.label)
          ),
        }));
      } catch (error) {
        console.error("Gagal menambah diskon:", error);
        toast.error("Gagal menambah diskon.");
      }
    },

    updateDiscount: async (discountId, data) => {
      const supabase = createClient();
      try {
        const { data: updatedDiscount, error } = await supabase
          .from("discount")
          .update(data)
          .eq("id", discountId)
          .select()
          .single();

        if (error) throw error;
        toast.success(`Diskon "${updatedDiscount.label}" berhasil diperbarui.`);

        // Optimistic update
        set((state) => ({
          discountOptions: state.discountOptions.map((d) =>
            d.id === discountId ? updatedDiscount : d
          ),
        }));
      } catch (error) {
        console.error("Gagal memperbarui diskon:", error);
        toast.error("Gagal memperbarui diskon.");
      }
    },

    deleteDiscount: async (discountId) => {
      const supabase = createClient();
      try {
        // Ambil data dulu untuk toast message
        const discountToDelete = get().discountOptions.find(
          (d) => d.id === discountId
        );
        if (!discountToDelete) throw new Error("Diskon tidak ditemukan");

        const { error } = await supabase
          .from("discount")
          .delete()
          .eq("id", discountId);

        if (error) throw error;
        toast.success(`Diskon "${discountToDelete.label}" berhasil dihapus.`);

        // Optimistic update
        set((state) => ({
          discountOptions: state.discountOptions.filter(
            (d) => d.id !== discountId
          ),
        }));
      } catch (error) {
        console.error("Gagal menghapus diskon:", error);
        toast.error("Gagal menghapus diskon.");
      }
    },
  })
);
