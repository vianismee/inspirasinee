import { createClient } from "@/utils/supabase/client";
import { create } from "zustand";

interface Customer {
  id: number;
  customer_id: string;
  username: string;
  email?: string;
  whatsapp: string;
  alamat?: string;
}
interface CustomerData {
  customer_id: string;
  username: string;
  email?: string;
  whatsapp: string;
  alamat?: string;
}

interface CustomerState {
  activeCustomer: CustomerData | null;
  setCustomer: (customer: CustomerData) => void;
  findOrCreateCustomer: (
    customerData: CustomerData
  ) => Promise<Customer | null>;
  clearCustomer: () => void;
}

export const useCustomerStore = create<CustomerState>((set) => ({
  activeCustomer: null,

  setCustomer: (customer) => set({ activeCustomer: customer }),

  findOrCreateCustomer: async (customerData) => {
    const { customer_id, whatsapp, username, email, alamat } = customerData;
    const supabase = createClient();

    const { data: existingCustomer, error: findError } = await supabase
      .from("customers")
      .select("*")
      .eq("whatsapp", whatsapp)
      .maybeSingle();
    if (findError) {
      console.log("Gagagal mencari Customer", findError);
      return null;
    }
    const finalyData = {
      customer_id: customer_id,
      username: username,
      email: email,
      whatsapp: whatsapp,
    };
    if (existingCustomer) {
      set({ activeCustomer: existingCustomer });
      return existingCustomer;
    }
    const { data: newCustomer, error: createError } = await supabase
      .from("customers")
      .insert(finalyData)
      .select("*")
      .single();
    if (createError) {
      console.log("Gagal menambah Customer", createError);
      return null;
    }
    set({ activeCustomer: newCustomer });
    return newCustomer;
  },

  clearCustomer: () => set({ activeCustomer: null }),
}));
