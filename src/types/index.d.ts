// BARU: Tipe untuk satu layanan di dalam item yang sudah dikelompokkan
export type ServiceDetail = {
  service: string;
  amount: string;
};

// BARU: Tipe untuk item yang sudah dikelompokkan berdasarkan nama sepatu
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
};

export type IDiscount = {
  order_invoice_id: number;
  discount_code: string;
  discounted_amount: number;
};

export type Orders = {
  customer_id: string;
  customers: ICustomers; // Seharusnya ICustomers agar konsisten
  invoice_id: string;
  status: string;
  order_item: GroupedOrderItem[]; // UBAH: Menggunakan tipe data yang sudah dikelompokkan
  subtotal: number;
  order_discounts?: IDiscount[]; // Seharusnya IDiscount agar konsisten
  total_price: number;
  payment: string;
  created_at: string;
};
