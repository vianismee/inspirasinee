import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { create } from "zustand";
import type { Banner } from "@/types/banner";

// Constants
export const MAX_BANNERS = 10;
const MAX_UPLOAD_SIZE = 3 * 1024 * 1024; // 3MB
const MAX_COMPRESSED_SIZE = 500 * 1024; // 500KB
const SUPABASE_BUCKET = "banner-promotion";

// Helper function to compress image
export const compressImage = async (
  file: File,
  maxSizeKB: number = 500
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        // Set canvas dimensions to match original image
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw image on canvas
        ctx.drawImage(img, 0, 0);

        // Start with high quality and reduce if needed
        let quality = 0.9;

        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Failed to compress image"));
                return;
              }

              // If size is acceptable or quality is too low, return the result
              if (blob.size <= maxSizeKB * 1024 || quality <= 0.1) {
                resolve(blob);
                return;
              }

              // Reduce quality and try again
              quality -= 0.1;
              tryCompress();
            },
            "image/jpeg",
            quality
          );
        };

        tryCompress();
      };
      img.onerror = () => reject(new Error("Failed to load image"));
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
  });
};

// Helper function to calculate aspect ratio
export const calculateAspectRatio = (
  width: number,
  height: number
): string => {
  const gcd = (a: number, b: number): number => {
    return b === 0 ? a : gcd(b, a % b);
  };

  const divisor = gcd(width, height);
  const w = width / divisor;
  const h = height / divisor;

  return `${w}:${h}`;
};

// Helper function to get image dimensions
export const getImageDimensions = (
  file: File
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
};

interface BannerState {
  banners: Banner[];
  isLoading: boolean;
  isUploading: boolean;
  totalCount: number;
  fetchBanners: () => Promise<void>;
  uploadBanner: (data: {
    file: File;
    name?: string;
    link_url?: string;
    is_active?: boolean;
  }) => Promise<void>;
  deleteBanner: (bannerId: number) => Promise<void>;
  updateBanner: (
    bannerId: number,
    data: { link_url?: string; is_active?: boolean; display_order?: number }
  ) => Promise<void>;
  reorderBanners: (banners: Banner[]) => Promise<void>;
  subscribeToChanges: () => () => void;
  canAddMoreBanners: () => boolean;
}

export const useBannerStore = create<BannerState>((set, get) => ({
  banners: [],
  isLoading: false,
  isUploading: false,
  totalCount: 0,

  fetchBanners: async () => {
    set({ isLoading: true });
    const supabase = createClient();
    try {
      const { data: banners, error, count } = await supabase
        .from("banners")
        .select("*", { count: "exact" })
        .order("display_order", { ascending: true });

      if (error) throw error;

      set({
        banners: banners || [],
        totalCount: count || 0,
      });
    } catch (error) {
      console.error("Failed to fetch banners:", error);
      toast.error("Gagal memuat data banner.");
    } finally {
      set({ isLoading: false });
    }
  },

  uploadBanner: async ({ file, name, link_url, is_active = true }) => {
    const state = get();

    // Check if we can add more banners
    if (state.banners.length >= MAX_BANNERS) {
      toast.error(`Maksimum ${MAX_BANNERS} banner dapat diunggah.`);
      throw new Error(`Maximum ${MAX_BANNERS} banners allowed`);
    }

    // Validate file size
    if (file.size > MAX_UPLOAD_SIZE) {
      toast.error(`Ukuran file maksimum adalah ${MAX_UPLOAD_SIZE / (1024 * 1024)}MB.`);
      throw new Error("File size exceeds limit");
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Hanya file gambar yang diperbolehkan.");
      throw new Error("Invalid file type");
    }

    set({ isUploading: true });
    const supabase = createClient();

    try {
      // Get image dimensions and calculate aspect ratio
      const { width, height } = await getImageDimensions(file);
      const aspectRatio = calculateAspectRatio(width, height);

      // Compress image
      const compressedBlob = await compressImage(file, 500);

      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase
        .storage
        .from(SUPABASE_BUCKET)
        .upload(filePath, compressedBlob, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error(`Gagal mengupload gambar: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase
        .storage
        .from(SUPABASE_BUCKET)
        .getPublicUrl(filePath);

      const imageUrl = urlData.publicUrl;

      // Calculate display order (add to end)
      const maxOrder = state.banners.length > 0
        ? Math.max(...state.banners.map(b => b.display_order))
        : -1;

      // Insert into database
      const { data: newBanner, error: insertError } = await supabase
        .from("banners")
        .insert({
          name: name || null,
          image_url: imageUrl,
          image_ratio: aspectRatio,
          link_url: link_url || null,
          is_active: is_active,
          display_order: maxOrder + 1,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success("Banner berhasil ditambahkan.");

      set((state) => ({
        banners: [...state.banners, newBanner],
        totalCount: state.totalCount + 1,
      }));
    } catch (error) {
      console.error("Failed to upload banner:", error);
      const errorMessage = error instanceof Error ? error.message : "Gagal mengupload banner.";
      toast.error(errorMessage);
      throw error;
    } finally {
      set({ isUploading: false });
    }
  },

  deleteBanner: async (bannerId: number) => {
    const supabase = createClient();
    try {
      // Get banner data first to delete the image from storage
      const bannerToDelete = get().banners.find((b) => b.id === bannerId);
      if (!bannerToDelete) {
        throw new Error("Banner tidak ditemukan");
      }

      // Delete from database
      const { error } = await supabase
        .from("banners")
        .delete()
        .eq("id", bannerId);

      if (error) throw error;

      // Try to delete image from storage (extract filename from URL)
      try {
        const url = new URL(bannerToDelete.image_url);
        const pathParts = url.pathname.split("/");
        const fileName = pathParts[pathParts.length - 1];

        await supabase
          .storage
          .from(SUPABASE_BUCKET)
          .remove([fileName]);
      } catch (storageError) {
        console.warn("Failed to delete image from storage:", storageError);
        // Continue anyway as database record is deleted
      }

      toast.success("Banner berhasil dihapus.");

      set((state) => ({
        banners: state.banners.filter((b) => b.id !== bannerId),
        totalCount: state.totalCount - 1,
      }));
    } catch (error) {
      console.error("Failed to delete banner:", error);
      toast.error("Gagal menghapus banner.");
      throw error;
    }
  },

  updateBanner: async (bannerId, data) => {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("banners")
        .update(data)
        .eq("id", bannerId);

      if (error) throw error;

      toast.success("Banner berhasil diperbarui.");

      set((state) => ({
        banners: state.banners.map((b) =>
          b.id === bannerId ? { ...b, ...data } : b
        ),
      }));
    } catch (error) {
      console.error("Failed to update banner:", error);
      toast.error("Gagal memperbarui banner.");
      throw error;
    }
  },

  reorderBanners: async (banners) => {
    const supabase = createClient();
    try {
      // Update display_order for all banners
      const updates = banners.map((banner, index) => ({
        id: banner.id,
        display_order: index,
      }));

      // Update each banner
      for (const update of updates) {
        const { error } = await supabase
          .from("banners")
          .update({ display_order: update.display_order })
          .eq("id", update.id);

        if (error) throw error;
      }

      set({ banners });
    } catch (error) {
      console.error("Failed to reorder banners:", error);
      toast.error("Gagal mengurutkan ulang banner.");
      get().fetchBanners(); // Refresh to get correct order
    }
  },

  subscribeToChanges: () => {
    const supabase = createClient();
    const refreshData = () => {
      get().fetchBanners();
    };
    const schema =
      process.env.NEXT_PUBLIC_APP_ENV === "development" ? "dev" : "public";

    const channel = supabase
      .channel("banners_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: schema, table: "banners" },
        refreshData
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  canAddMoreBanners: () => {
    return get().banners.length < MAX_BANNERS;
  },
}));
