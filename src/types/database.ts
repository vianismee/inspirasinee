// Supabase Database Types
// These types will be expanded as we migrate to client-side operations

export interface Database {
  public: {
    Tables: {
      // Add table definitions as we discover them during migration
      users: {
        Row: {
          id: string;
          email: string;
          role: 'admin' | 'user';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          role?: 'admin' | 'user';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: 'admin' | 'user';
          updated_at?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          name: string;
          phone: string;
          email?: string;
          address?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          email?: string;
          address?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          email?: string;
          address?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          customer_id: string;
          service_id: string;
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
          total_price: number;
          notes?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          service_id: string;
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
          total_price: number;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          service_id?: string;
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
          total_amount?: number;
          notes?: string;
          updated_at?: string;
        };
      };
      service_catalog: {
        Row: {
          id: string;
          name: string;
          category_id: number;
          amount: number;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          name: string;
          category_id: number;
          amount: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category_id?: number;
          amount?: number;
          updated_at?: string;
        };
      };
      discounts: {
        Row: {
          id: string;
          code: string;
          type: 'percentage' | 'fixed';
          value: number;
          min_amount?: number;
          max_uses?: number;
          uses_count: number;
          is_active: boolean;
          expires_at?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          type: 'percentage' | 'fixed';
          value: number;
          min_amount?: number;
          max_uses?: number;
          uses_count?: number;
          is_active?: boolean;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          type?: 'percentage' | 'fixed';
          value?: number;
          min_amount?: number;
          max_uses?: number;
          uses_count?: number;
          is_active?: boolean;
          expires_at?: string;
          updated_at?: string;
        };
      };
      customer_membership_levels: {
        Row: {
          id: number;
          name: 'Bronze' | 'Silver' | 'Gold';
          level_index: number;
          points_multiplier: number;
          discount_percent: number;
          discount_max_amount: number;
          transaction_threshold: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: 'Bronze' | 'Silver' | 'Gold';
          level_index: number;
          points_multiplier?: number;
          discount_percent?: number;
          discount_max_amount?: number;
          transaction_threshold?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          name?: 'Bronze' | 'Silver' | 'Gold';
          level_index?: number;
          points_multiplier?: number;
          discount_percent?: number;
          discount_max_amount?: number;
          transaction_threshold?: number;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      membership_benefits: {
        Row: {
          id: number;
          membership_level_id: number;
          icon_name: string;
          title: string;
          description: string | null;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          membership_level_id: number;
          icon_name: string;
          title: string;
          description?: string;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          membership_level_id?: number;
          icon_name?: string;
          title?: string;
          description?: string;
          display_order?: number;
          updated_at?: string;
        };
      };
      customer_memberships: {
        Row: {
          id: number;
          customer_id: string;
          membership_level_id: number;
          progress_percent: number;
          total_transactions: number;
          shine_points: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          customer_id: string;
          membership_level_id: number;
          progress_percent?: number;
          total_transactions?: number;
          shine_points?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          customer_id?: string;
          membership_level_id?: number;
          progress_percent?: number;
          total_transactions?: number;
          shine_points?: number;
          updated_at?: string;
        };
      };
      membership_level_history: {
        Row: {
          id: string;
          customer_id: string;
          from_level_id: number | null;
          to_level_id: number;
          changed_at: string;
          trigger_reason: string | null;
        };
        Insert: {
          id?: string;
          customer_id: string;
          from_level_id?: number | null;
          to_level_id: number;
          changed_at?: string;
          trigger_reason?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          from_level_id?: number | null;
          to_level_id?: number;
          changed_at?: string;
          trigger_reason?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}