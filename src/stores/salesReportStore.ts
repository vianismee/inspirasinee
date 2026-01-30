import { createClient } from "@/utils/supabase/client";
import { create } from "zustand";

export interface SalesDataPoint {
  date: string;
  total: number;
  count: number;
}

export interface SalesReportData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  dailySales: SalesDataPoint[];
}

interface SalesReportState {
  data: SalesReportData | null;
  isLoading: boolean;
  fetchSalesReport: (startDate: string, endDate: string) => Promise<void>;
}

export const useSalesReportStore = create<SalesReportState>((set) => ({
  data: null,
  isLoading: false,

  fetchSalesReport: async (startDate, endDate) => {
    set({ isLoading: true });
    const supabase = createClient();
    const schema =
      process.env.NEXT_PUBLIC_APP_ENV === "development" ? "dev" : "public";

    try {
      // Fetch orders within the date range
      // Include the end date's full day by appending time
      const endDateWithTime = endDate + "T23:59:59.999Z";

      const { data, error } = await supabase
        .schema(schema)
        .from("orders")
        .select("invoice_id, total_price, created_at")
        .gte("created_at", startDate)
        .lte("created_at", endDateWithTime)
        .order("created_at", { ascending: true });

      if (error) {
        throw error;
      }

      // Process data for daily sales
      const dailySalesMap = new Map<string, { total: number; count: number }>();

      // Initialize all dates in range with 0 values
      const start = new Date(startDate);
      const end = new Date(endDate);
      const currentDate = new Date(start);

      while (currentDate <= end) {
        const dateKey = currentDate.toISOString().split("T")[0];
        dailySalesMap.set(dateKey, { total: 0, count: 0 });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Aggregate sales by date
      (data || []).forEach((order) => {
        const dateKey = new Date(order.created_at).toISOString().split("T")[0];
        const existing = dailySalesMap.get(dateKey) || { total: 0, count: 0 };
        dailySalesMap.set(dateKey, {
          total: existing.total + (order.total_price || 0),
          count: existing.count + 1,
        });
      });

      // Convert map to array
      const dailySales: SalesDataPoint[] = Array.from(
        dailySalesMap.entries()
      ).map(([date, { total, count }]) => ({
        date,
        total,
        count,
      }));

      // Calculate summary statistics
      const totalRevenue = dailySales.reduce((sum, day) => sum + day.total, 0);
      const totalOrders = dailySales.reduce((sum, day) => sum + day.count, 0);
      const averageOrderValue =
        totalOrders > 0 ? totalRevenue / totalOrders : 0;

      console.log("Sales Report Data:", { startDate, endDate, totalOrders, totalRevenue, dailySales });

      set({
        data: {
          totalRevenue,
          totalOrders,
          averageOrderValue,
          dailySales,
        },
      });
    } catch (error) {
      console.error("Error fetching sales report:", error);
      set({ data: null, isLoading: false });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));
