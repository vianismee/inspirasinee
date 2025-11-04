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

type NewServiceData = {
  name: string;
  amount: number;
  category_id: number;
};

interface ServiceCatalogState {
  serviceCatalog: ServiceCatalog[];
  allServicesCatalog: ServiceCatalog[];
  discountOptions: Discount[];
  serviceCategory: Category[];
  isLoading: boolean;
  totalCount: number;
  fetchCatalog: (options?: { page?: number; pageSize?: number }) => Promise<void>;
  fetchAllCatalog: () => Promise<void>;
  addService: (data: NewServiceData) => Promise<void>;
  updateService: (serviceId: number, data: NewServiceData) => Promise<void>;
  deleteService: (serviceId: number) => Promise<void>;
  subscribeToChanges: () => () => void;
  addDiscount: (data: DiscountFormData) => Promise<void>;
  updateDiscount: (discountId: number, data: DiscountFormData) => Promise<void>;
  deleteDiscount: (discountId: number) => Promise<void>;
  updateCategory: (categoryId: number, newName: string) => Promise<void>;
  deleteCategory: (categoryId: number) => Promise<void>;
}

export const useServiceCatalogStore = create<ServiceCatalogState>(
  (set, get) => ({
    serviceCatalog: [],
    allServicesCatalog: [],
    discountOptions: [],
    serviceCategory: [],
    isLoading: false,
    totalCount: 0,

    fetchCatalog: async (options = {}) => {
      const { page = 1, pageSize = 10 } = options;
      set({ isLoading: true });
      const supabase = createClient();
      try {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const [
          { data: serviceData, error: serviceError },
          { data: discountData, error: discountError },
          { data: categoryData, error: categoryError },
          { count: totalCount, error: countError },
        ] = await Promise.all([
          supabase
            .from("service_catalog")
            .select("*, service_category(*)")
            .order("name", { ascending: true })
            .range(from, to),
          supabase.from("discount").select("*"),
          supabase
            .from("service_category")
            .select("*")
            .order("name", { ascending: true }),
          supabase
            .from("service_catalog")
            .select("*", { count: "exact", head: true })
        ]);

        if (serviceError) throw serviceError;
        if (discountError) throw discountError;
        if (categoryError) throw categoryError;
        if (countError) console.warn("Could not get total count", { error: countError });

        set({
          serviceCatalog: serviceData || [],
          discountOptions: discountData || [],
          serviceCategory: categoryData || [],
          totalCount: totalCount || 0,
        });
      } catch (error) {
        console.error("Gagal memuat data katalog:", error);
        toast.error("Gagal memuat data katalog.");
      } finally {
        set({ isLoading: false });
      }
    },

    fetchAllCatalog: async () => {
      set({ isLoading: true });
      const supabase = createClient();
      try {
        const { data: allServiceData, error: serviceError } = await supabase
          .from("service_catalog")
          .select("*, service_category(*)")
          .order("name", { ascending: true });

        if (serviceError) throw serviceError;

        set({
          allServicesCatalog: allServiceData || [],
        });
      } catch (error) {
        console.error("Gagal memuat semua data katalog:", error);
        toast.error("Gagal memuat semua data katalog.");
      } finally {
        set({ isLoading: false });
      }
    },

    addService: async (dataToAdd) => {
      const supabase = createClient();
      try {
        const { error } = await supabase
          .from("service_catalog")
          .insert(dataToAdd);

        if (error) {
          throw error;
        }
        toast.success(`Layanan "${dataToAdd.name}" berhasil ditambahkan.`);
        get().fetchCatalog();
        get().fetchAllCatalog();
      } catch (error) {
        console.error("Gagal menambah service:", error);
        toast.error("Gagal menambah layanan baru.");
        throw error;
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

        set((state) => {
          const updateService = (service: ServiceCatalog) => {
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
          };

          const updatedCatalog = state.serviceCatalog.map(updateService);
          const updatedAllCatalog = state.allServicesCatalog.map(updateService);

          return {
            serviceCatalog: updatedCatalog,
            allServicesCatalog: updatedAllCatalog
          };
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

        set((state) => ({
          serviceCatalog: state.serviceCatalog.filter(
            (s) => s.id !== serviceId
          ),
          allServicesCatalog: state.allServicesCatalog.filter(
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
      const refreshData = () => {
        get().fetchCatalog();
        get().fetchAllCatalog();
      };
      const schema =
        process.env.NEXT_PUBLIC_APP_ENV === "development" ? "dev" : "public";

      const serviceChannel = supabase
        .channel("service_catalog_changes")
        .on(
          "postgres_changes",
          { event: "*", schema: schema, table: "service_catalog" },
          refreshData
        )
        .subscribe();

      const categoryChannel = supabase
        .channel("service_category_changes")
        .on(
          "postgres_changes",
          { event: "*", schema: schema, table: "service_category" },
          refreshData
        )
        .subscribe();

      const discountChannel = supabase
        .channel("discount_changes")
        .on(
          "postgres_changes",
          { event: "*", schema: schema, table: "discount" },
          refreshData
        )
        .subscribe();
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

    updateCategory: async (categoryId, newName) => {
      const supabase = createClient();
      try {
        const { error } = await supabase
          .from("service_category")
          .update({ name: newName })
          .eq("id", categoryId);

        if (error) throw error;

        toast.success(`Kategori berhasil diubah menjadi "${newName}".`);
        get().fetchCatalog();
      } catch (error) {
        console.error("Gagal memperbarui kategori:", error);
        toast.error("Gagal memperbarui kategori.");
      }
    },

    deleteCategory: async (categoryId) => {
      const supabase = createClient();
      try {
        const categoryToDelete = get().serviceCategory.find(
          (c) => c.id === categoryId
        );
        if (!categoryToDelete) throw new Error("Kategori tidak ditemukan.");

        const { error } = await supabase
          .from("service_category")
          .delete()
          .eq("id", categoryId);

        if (error) throw error;

        toast.success(`Kategori "${categoryToDelete.name}" berhasil dihapus.`);
        get().fetchCatalog();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error("Gagal menghapus kategori:", error);
        toast.error(
          error.message.includes("foreign key constraint")
            ? "Gagal hapus: Kategori masih digunakan oleh layanan."
            : "Gagal menghapus kategori."
        );
      }
    },
  })
);
