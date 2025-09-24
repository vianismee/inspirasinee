export type ServiceDetail = {
  service: string;
  amount: string;
};

export type GroupedOrderItem = {
  shoe_name: string;
  services: ServiceDetail[];
};

export type IService = {
  name: string;
  category_id: number;
  amount: number | 0;
};

export type IItems = {
  service: string;
  shoe_name: string;
  amount: string;
};

export type ICustomers = {
  customer_id: string;
  username: string;
  whatsapp: string;
  alamat?: string;
  email?: string;
  orders?: Orders[];
  totalSpent?: number;
  points_balance?: number;
};

export type IDiscount = {
  order_invoice_id: number;
  discount_code: string;
  discounted_amount: number;
};

export type IReferralSettings = {
  id?: number;
  setting_name: string;
  setting_value: string;
  created_at?: string;
  updated_at?: string;
};

export type ICustomerPoints = {
  id?: number;
  customer_id: string;
  points_balance: number;
  created_at?: string;
  updated_at?: string;
};

export type IPointTransaction = {
  id?: number;
  customer_id: string;
  transaction_type: 'credit' | 'debit';
  points: number;
  order_invoice_id?: string;
  related_customer_id?: string;
  description?: string;
  created_at?: string;
};

export type ICustomerPointsSummary = {
  customer_id: string;
  points_balance: number;
  username: string;
  whatsapp: string;
  points_created_at?: string;
  points_updated_at?: string;
};

export type Orders = {
  customer_id: string;
  customers: ICustomers;
  invoice_id: string;
  status: string;
  order_item: GroupedOrderItem[];
  subtotal: number;
  order_discounts?: IDiscount[];
  total_price: number;
  payment: string;
  created_at: string;
  referral_code_used?: string;
  referral_discount_amount?: number;
  points_used?: number;
  points_discount_amount?: number;
};
