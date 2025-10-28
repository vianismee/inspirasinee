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
          total_amount: number;
          notes?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          service_id: string;
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
          total_amount: number;
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