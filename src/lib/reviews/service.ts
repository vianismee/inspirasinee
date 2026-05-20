import { supabase } from "@/utils/supabase/client";

export interface CustomerReview {
  id: number;
  customer_id: string;
  reviewer_phone: string;
  invoice_id: string | null;
  rating_speed: number;
  rating_accuracy: number;
  rating_service: number;
  overall_rating: number;
  description: string;
  status: "approved" | "rejected";
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReviewStats {
  total: number;
  visible: number;
  hidden: number;
  avg_overall: number;
}

export type ReviewFilter = "all" | "visible" | "hidden";

export const ReviewService = {
  async getReviews(filter: ReviewFilter = "all"): Promise<CustomerReview[]> {
    let query = supabase
      .from("customer_reviews")
      .select("id,customer_id,reviewer_phone,invoice_id,rating_speed,rating_accuracy,rating_service,overall_rating,description,status,is_featured,created_at,updated_at")
      .order("created_at", { ascending: false });

    if (filter === "visible") query = query.eq("status", "approved");
    if (filter === "hidden") query = query.eq("status", "rejected");

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as CustomerReview[];
  },

  async getStats(): Promise<ReviewStats> {
    const { data, error } = await supabase
      .from("customer_reviews")
      .select("status,overall_rating");

    if (error) throw error;

    const rows = data ?? [];
    const visible = rows.filter((r) => r.status === "approved").length;
    const hidden = rows.filter((r) => r.status === "rejected").length;
    const avg_overall =
      visible > 0
        ? rows
            .filter((r) => r.status === "approved")
            .reduce((sum, r) => sum + r.overall_rating, 0) / visible
        : 0;

    return { total: rows.length, visible, hidden, avg_overall };
  },

  async setVisibility(id: number, visible: boolean): Promise<void> {
    const { data, error } = await supabase
      .from("customer_reviews")
      .update({
        status: visible ? "approved" : "rejected",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id");

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error("RLS_BLOCKED");
    }
  },
};

export function maskPhone(phone: string): string {
  if (phone.length < 8) return phone;
  return phone.slice(0, 4) + "****" + phone.slice(-4);
}
