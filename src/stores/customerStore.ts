import { createClient } from "@/utils/supabase/client";
import { create } from "zustand";

interface CustomerData {
  isNew: boolean;
  customer_id: string;
  username: string;
  email?: string;
  whatsapp: string;
  alamat?: string;
}

interface CustomerState {
  activeCustomer: CustomerData | null;
  prepareCustomer: (
    customerData: Omit<CustomerData, "isNew">
  ) => Promise<boolean>;
  clearCustomer: () => void;
}

export const useCustomerStore = create<CustomerState>((set) => ({
  activeCustomer: null,

  prepareCustomer: async (customerData) => {
    const { whatsapp } = customerData;
    const supabase = createClient();

    const { data: existingCustomer, error: findError } = await supabase
      .from("customers")
      .select("*")
      .eq("whatsapp", whatsapp)
      .maybeSingle();
    if (findError) {
      console.log("Gagagal mencari Customer", findError);
      return false;
    }
    if (existingCustomer) {
      set({ activeCustomer: { ...existingCustomer, isNew: false } });
      return true;
    }

    set({ activeCustomer: { ...customerData, isNew: true } });
    return true;
  },

  clearCustomer: () => set({ activeCustomer: null }),
}));
