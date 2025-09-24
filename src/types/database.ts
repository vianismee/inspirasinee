export interface Database {
  public: {
    Tables: {
      referral_settings: {
        Row: {
          id: number;
          setting_name: string;
          setting_value: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          setting_name: string;
          setting_value: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          setting_name?: string;
          setting_value?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      customer_points: {
        Row: {
          id: number;
          customer_id: string;
          points_balance: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          customer_id: string;
          points_balance?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          customer_id?: string;
          points_balance?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      point_transactions: {
        Row: {
          id: number;
          customer_id: string;
          transaction_type: 'credit' | 'debit';
          points: number;
          order_invoice_id: string | null;
          related_customer_id: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          customer_id: string;
          transaction_type: 'credit' | 'debit';
          points: number;
          order_invoice_id?: string | null;
          related_customer_id?: string | null;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          customer_id?: string;
          transaction_type?: 'credit' | 'debit';
          points?: number;
          order_invoice_id?: string | null;
          related_customer_id?: string | null;
          description?: string | null;
          created_at?: string;
        };
      };
      customer_points_summary: {
        Row: {
          customer_id: string;
          points_balance: number;
          username: string;
          whatsapp: string;
          points_created_at: string;
          points_updated_at: string;
        };
      };
    };
    Functions: {
      get_customer_points_balance: {
        Args: {
          p_customer_id: string;
        };
        Returns: number;
      };
      add_customer_points: {
        Args: {
          p_customer_id: string;
          p_points: number;
          p_description?: string;
          p_order_invoice_id?: string;
          p_related_customer_id?: string;
        };
        Returns: boolean;
      };
      deduct_customer_points: {
        Args: {
          p_customer_id: string;
          p_points: number;
          p_description?: string;
          p_order_invoice_id?: string;
        };
        Returns: boolean;
      };
      get_referral_setting: {
        Args: {
          p_setting_name: string;
        };
        Returns: string;
      };
      update_referral_setting: {
        Args: {
          p_setting_name: string;
          p_setting_value: string;
        };
        Returns: boolean;
      };
    };
  };
}