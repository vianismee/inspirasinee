import { create } from "zustand";

interface CustomerData {
  customer: string;
  email?: string;
  whatsapp: string;
  alamat?: string;
}

interface CustomerState {
  activeCustomer: CustomerData | null;
  setCustomer: (customer: CustomerData) => void;
  clearCustomer: () => void;
}

export const useCustomerStore = create<CustomerState>((set) => ({
  activeCustomer: null,

  setCustomer: (customer) => set({ activeCustomer: customer }),

  clearCustomer: () => set({ activeCustomer: null }),
}));
