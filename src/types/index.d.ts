export type IService = {
  name: string;
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
};

export type IDiscount = {
  order_invoice_id: number;
  discount_code: string;
  discounted_amount: number;
};
