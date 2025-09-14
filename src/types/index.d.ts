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
};

export type IDiscount = {
  order_invoice_id: number;
  discount_code: string;
  discounted_amount: number;
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
};
