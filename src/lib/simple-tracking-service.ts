// Simple types for tracking — dipertahankan agar consumer tidak rusak.
export interface SimpleOrderData {
  invoice_id: string;
  customer_id: string;
  status: string;
  total_price: number;
  subtotal: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
}

export interface SimpleOrderItem {
  id: string;
  service_name: string;
  shoe_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
}

export interface CustomerInfo {
  name?: string;
  phone?: string;
  email?: string;
}

// ponytail: CustomerInfo & getCustomerInfo tetap diekspor (consumer compat) tapi
// tidak lagi mengambil data — PII dimasking server-side. Hapus saat UI tracking bersih.
export interface TrackApiResponse {
  order: SimpleOrderData;
  items: SimpleOrderItem[];
}

// Simple tracking service — semua query lewat /api/track (server-side, service role).
class SimpleTrackingService {
  validateInvoiceId(invoiceId: string): boolean {
    return /^[A-Za-z0-9_-]{3,30}$/.test(invoiceId);
  }

  async getOrderById(invoiceId: string): Promise<SimpleOrderData | null> {
    const { order } = await this.fetchTrack(invoiceId);
    return order ?? null;
  }

  async getCustomerInfo(_customerId: string): Promise<CustomerInfo | null> {
    return null; // PII dimasking — tracking sepatu tidak butuh nama/nomor HP
  }

  async getOrderItems(invoiceId: string): Promise<SimpleOrderItem[]> {
    const { items } = await this.fetchTrack(invoiceId);
    return items;
  }

  async getFullOrderData(invoiceId: string): Promise<{
    order: SimpleOrderData | null;
    customer: CustomerInfo | null;
    items: SimpleOrderItem[];
  }> {
    if (!this.validateInvoiceId(invoiceId)) {
      return { order: null, customer: null, items: [] };
    }
    try {
      const { order, items } = await this.fetchTrack(invoiceId);
      return { order, customer: null, items };
    } catch {
      return { order: null, customer: null, items: [] };
    }
  }

  private async fetchTrack(
    invoiceId: string
  ): Promise<{ order: SimpleOrderData | null; items: SimpleOrderItem[] }> {
    if (!this.validateInvoiceId(invoiceId)) {
      throw new Error("invalid invoice");
    }
    const res = await fetch(
      `/api/track?invoice=${encodeURIComponent(invoiceId)}`
    );
    if (!res.ok) {
      throw new Error(res.status === 404 ? "not found" : `error ${res.status}`);
    }
    return res.json();
  }
}

// Export singleton instance
export const simpleTrackingService = new SimpleTrackingService();
