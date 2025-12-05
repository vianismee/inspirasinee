import { create } from "zustand";
import { supabase } from "@/utils/supabase/client";
import { logger } from "@/utils/client/logger";

// Types for drop-point customer data
export interface DropPointCustomer {
  customer_id: string;
  username: string;
  whatsapp: string;
  email?: string;
  alamat?: string;
  marker_id: string;
  drop_point_id: number;
  drop_point_name: string;
  total_orders: number;
  total_items: number;
  first_order_date: string;
  last_order_date: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerAnalytics {
  total_customers: number;
  active_customers: number;
  total_orders: number;
  total_items: number;
  total_revenue: number;
  average_orders_per_customer: number;
  average_items_per_order: number;
  top_drop_points: Array<{
    drop_point_id: number;
    drop_point_name: string;
    customer_count: number;
    total_orders: number;
    total_revenue: number;
  }>;
  customer_segments: {
    new_customers: number; // Less than 30 days
    regular_customers: number; // 30-90 days
    loyal_customers: number; // More than 90 days
  };
}

interface AdminDropPointCustomerStore {
  // State
  customers: DropPointCustomer[];
  analytics: CustomerAnalytics | null;
  loading: boolean;
  error: string | null;

  // Pagination and filtering
  currentPage: number;
  perPage: number;
  totalCount: number;
  searchQuery: string;
  selectedDropPoint: number | null;
  dateRange: {
    start: string | null;
    end: string | null;
  };

  // Actions
  fetchCustomers: (params?: {
    page?: number;
    perPage?: number;
    search?: string;
    dropPointId?: number;
    dateRange?: { start?: string; end?: string };
  }) => Promise<void>;

  fetchAnalytics: () => Promise<void>;

  setFilters: (filters: {
    search?: string;
    dropPointId?: number | null;
    dateRange?: { start?: string; end?: string };
  }) => void;

  setPage: (page: number) => void;
  setPerPage: (perPage: number) => void;

  exportCustomers: (format: 'csv' | 'excel') => Promise<void>;

  clearError: () => void;
}

export const useAdminDropPointCustomerStore = create<AdminDropPointCustomerStore>(
  (set, get) => ({
    // Initial state
    customers: [],
    analytics: null,
    loading: false,
    error: null,
    currentPage: 1,
    perPage: 50,
    totalCount: 0,
    searchQuery: "",
    selectedDropPoint: null,
    dateRange: { start: null, end: null },

    // Fetch customers with pagination and filtering
    fetchCustomers: async (params = {}) => {
      const {
        page = get().currentPage,
        perPage = get().perPage,
        search = get().searchQuery,
        dropPointId = get().selectedDropPoint,
        dateRange = get().dateRange,
      } = params;

      try {
        set({ loading: true, error: null });

        logger.info(
          "Fetching drop-point customers",
          { page, perPage, search, dropPointId, dateRange },
          "AdminDropPointCustomerStore"
        );

        // Build query
        let query = supabase
          .from('drop_point_customer_markers')
          .select(`
            *,
            customers!inner (
              customer_id,
              username,
              whatsapp,
              email,
              alamat
            ),
            drop_points!inner (
              id,
              name
            )
          `, { count: 'exact' });

        // Apply filters
        if (search) {
          query = query.or(`
            customers.username.ilike.%${search}%,
            customers.whatsapp.ilike.%${search}%,
            marker_id.ilike.%${search}%,
            customers.email.ilike.%${search}%
          `);
        }

        if (dropPointId) {
          query = query.eq('drop_point_id', dropPointId);
        }

        if (dateRange.start) {
          query = query.gte('last_order_date', dateRange.start);
        }

        if (dateRange.end) {
          query = query.lte('last_order_date', dateRange.end);
        }

        // Apply pagination and ordering
        const from = (page - 1) * perPage;
        const to = from + perPage - 1;

        const { data, error, count } = await query
          .range(from, to)
          .order('last_order_date', { ascending: false });

        if (error) {
          throw error;
        }

        // Transform data to match our interface
        const transformedData: DropPointCustomer[] = (data || []).map((item: any) => ({
          customer_id: item.customers.customer_id,
          username: item.customers.username,
          whatsapp: item.customers.whatsapp,
          email: item.customers.email,
          alamat: item.customers.alamat,
          marker_id: item.marker_id,
          drop_point_id: item.drop_point_id,
          drop_point_name: item.drop_points.name,
          total_orders: item.total_orders,
          total_items: item.total_items,
          first_order_date: item.first_order_date,
          last_order_date: item.last_order_date,
          created_at: item.created_at,
          updated_at: item.updated_at,
        }));

        logger.info(
          "Successfully fetched customers",
          { count: transformedData.length, totalCount: count },
          "AdminDropPointCustomerStore"
        );

        set({
          customers: transformedData,
          totalCount: count || 0,
          currentPage: page,
          perPage,
          loading: false,
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch customers';
        logger.error("Error fetching customers", { error }, "AdminDropPointCustomerStore");

        set({
          error: errorMessage,
          loading: false
        });
      }
    },

    // Fetch customer analytics
    fetchAnalytics: async () => {
      try {
        set({ loading: true, error: null });

        logger.info("Fetching customer analytics", {}, "AdminDropPointCustomerStore");

        // Get basic analytics
        const { data: customerData, error: customerError } = await supabase
          .from('drop_point_customer_markers')
          .select(`
            total_orders,
            total_items,
            first_order_date,
            last_order_date,
            drop_point_id,
            drop_points!inner (
              name
            )
          `);

        if (customerError) {
          throw customerError;
        }

        // Get revenue data
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('total_price, drop_point_id')
          .eq('fulfillment_type', 'drop-point');

        if (orderError) {
          throw orderError;
        }

        // Calculate analytics
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

        const customerSegments = (customerData || []).reduce((acc, customer: any) => {
          const lastOrder = new Date(customer.last_order_date);
          if (lastOrder > thirtyDaysAgo) {
            acc.new_customers++;
          } else if (lastOrder > ninetyDaysAgo) {
            acc.regular_customers++;
          } else {
            acc.loyal_customers++;
          }
          return acc;
        }, { new_customers: 0, regular_customers: 0, loyal_customers: 0 });

        // Top drop-points by customer count
        const dropPointStats = (customerData || []).reduce((acc: any, customer: any) => {
          const key = customer.drop_point_id;
          if (!acc[key]) {
            acc[key] = {
              drop_point_id: customer.drop_point_id,
              drop_point_name: customer.drop_points.name,
              customer_count: 0,
              total_orders: 0,
              total_revenue: 0,
            };
          }
          acc[key].customer_count++;
          acc[key].total_orders += customer.total_orders;
          return acc;
        }, {});

        // Add revenue to drop-point stats
        (orderData || []).forEach((order: any) => {
          if (dropPointStats[order.drop_point_id]) {
            dropPointStats[order.drop_point_id].total_revenue += order.total_price || 0;
          }
        });

        const topDropPoints = Object.values(dropPointStats)
          .sort((a: any, b: any) => b.customer_count - a.customer_count)
          .slice(0, 5);

        const totalRevenue = (orderData || []).reduce((sum, order) => sum + (order.total_price || 0), 0);

        const analytics: CustomerAnalytics = {
          total_customers: customerData?.length || 0,
          active_customers: customerSegments.new_customers + customerSegments.regular_customers,
          total_orders: customerData?.reduce((sum, c) => sum + c.total_orders, 0) || 0,
          total_items: customerData?.reduce((sum, c) => sum + c.total_items, 0) || 0,
          total_revenue: totalRevenue,
          average_orders_per_customer: customerData?.length ?
            (customerData.reduce((sum, c) => sum + c.total_orders, 0) / customerData.length) : 0,
          average_items_per_order: orderData?.length ?
            (orderData.reduce((sum, o) => sum + (o.total_price || 0), 0) / orderData.length) : 0,
          top_drop_points: topDropPoints as any,
          customer_segments: customerSegments,
        };

        set({ analytics, loading: false });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch analytics';
        logger.error("Error fetching analytics", { error }, "AdminDropPointCustomerStore");

        set({
          error: errorMessage,
          loading: false
        });
      }
    },

    // Set filters
    setFilters: (filters) => {
      const { search, dropPointId, dateRange } = filters;
      set((state) => ({
        searchQuery: search ?? state.searchQuery,
        selectedDropPoint: dropPointId ?? state.selectedDropPoint,
        dateRange: dateRange ? { ...dateRange } : state.dateRange,
        currentPage: 1, // Reset to first page when filters change
      }));

      // Refetch data with new filters
      get().fetchCustomers();
    },

    // Set page
    setPage: (page) => {
      set({ currentPage: page });
      get().fetchCustomers({ page });
    },

    // Set per page
    setPerPage: (perPage) => {
      set({ perPage, currentPage: 1 });
      get().fetchCustomers({ perPage, page: 1 });
    },

    // Export customers
    exportCustomers: async (format: 'csv' | 'excel') => {
      try {
        logger.info(`Exporting customers as ${format}`, {}, "AdminDropPointCustomerStore");

        // Fetch all customers without pagination for export
        const { data, error } = await supabase
          .from('drop_point_customer_markers')
          .select(`
            *,
            customers!inner (
              username,
              whatsapp,
              email
            ),
            drop_points!inner (
              name
            )
          `)
          .order('last_order_date', { ascending: false });

        if (error) {
          throw error;
        }

        // Transform data for export
        const exportData = (data || []).map((item: any) => ({
          'Customer Name': item.customers.username,
          'WhatsApp': item.customers.whatsapp,
          'Email': item.customers.email || '',
          'Customer Marker': item.marker_id,
          'Drop-Point': item.drop_points.name,
          'Total Orders': item.total_orders,
          'Total Items': item.total_items,
          'First Order Date': new Date(item.first_order_date).toLocaleDateString(),
          'Last Order Date': new Date(item.last_order_date).toLocaleDateString(),
        }));

        // Generate CSV
        if (format === 'csv') {
          const headers = Object.keys(exportData[0] || {});
          const csvContent = [
            headers.join(','),
            ...exportData.map(row =>
              headers.map(header => {
                const value = row[header as keyof typeof row];
                // Escape commas and quotes in CSV
                const stringValue = String(value || '').replace(/"/g, '""');
                return `"${stringValue}"`;
              }).join(',')
            ),
          ].join('\n');

          // Download file
          const blob = new Blob([csvContent], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `drop-point-customers-${new Date().toISOString().split('T')[0]}.csv`;
          a.click();
          URL.revokeObjectURL(url);
        }

        logger.info(
          "Successfully exported customers",
          { count: exportData.length, format },
          "AdminDropPointCustomerStore"
        );

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to export customers';
        logger.error("Error exporting customers", { error }, "AdminDropPointCustomerStore");
        set({ error: errorMessage });
      }
    },

    // Clear error
    clearError: () => set({ error: null }),
  })
);