// Banner types for the application

export interface Banner {
  id: number;
  name: string | null;
  image_url: string;
  image_ratio: string;
  link_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface BannerFormData {
  image_url: string;
  image_ratio: string;
  link_url?: string;
  is_active?: boolean;
  display_order?: number;
}

export interface BannerUploadData {
  file: File;
  link_url?: string;
  is_active?: boolean;
}

// Common aspect ratios
export const ASPECT_RATIOS = {
  "16:9": { width: 16, height: 9 },
  "4:3": { width: 4, height: 3 },
  "1:1": { width: 1, height: 1 },
  "21:9": { width: 21, height: 9 },
  "3:2": { width: 3, height: 2 },
  "9:16": { width: 9, height: 16 }, // Vertical
} as const;

export type AspectRatioKey = keyof typeof ASPECT_RATIOS;
