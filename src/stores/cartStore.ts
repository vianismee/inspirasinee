import { create } from "zustand";
import { useServiceCatalogStore } from "./serviceCatalogStore";
import { createClient } from "@/utils/supabase/client";
import { useCustomerStore } from "./customerStore";
import { toast } from "sonner";

interface Discount {
  label: string;
  amount: number;
  code: string;
}

interface CartItem {
  id: number;
  shoeName: string;
  serviceName: string;
  amount: number;
}

interface CartState {
  invoice: string;
  cart: CartItem[];
  subTotal: number;
  activeDiscount: Discount | null;
  totalPrice: number;
  payment: string;
  newPayment: (payment: string) => void;
  newInvoice: (id: string) => void;
  addItem: () => void;
  updateItem: (
    id: number,
    field: keyof CartItem,
    value: string | number
  ) => void;
  removeItem: (id: number) => void;
  applyDiscount: (code: string) => boolean;
  removeDiscount: () => void;
  handleSubmit: () => Promise<boolean>;
  resetCart: () => void;
  resetItems: () => void;
}

const empatyService: Omit<CartItem, "id"> = {
  shoeName: "",
  serviceName: "",
  amount: 0,
};

const calculateTotal = (cart: CartItem[]) => {
  return cart.reduce((total, item) => total + item.amount, 0);
};

export const useCartStore = create<CartState>((set, get) => ({
  invoice: "",
  cart: [{ ...empatyService, id: Date.now() }],
  subTotal: 0,
  activeDiscount: null,
  totalPrice: 0,
  payment: "Cash",

  newInvoice: (id) => {
    set(() => {
      return { invoice: id };
    });
  },

  newPayment: (payment) => set({ payment: payment }),

  addItem: () =>
    set((state) => {
      const newCart = [...state.cart, { ...empatyService, id: Date.now() }];
      return {
        cart: newCart,
        subTotal: calculateTotal(newCart),
      };
    }),

  removeItem: (id) =>
    set((state) => {
      if (state.cart.length <= 1) return state;
      const newCart = state.cart.filter((item) => item.id !== id);
      return {
        cart: newCart,
        subTotal: calculateTotal(newCart),
      };
    }),

  updateItem: (id, field, value) =>
    set((state) => {
      const { serviceCatalog } = useServiceCatalogStore.getState();
      const newCart = state.cart.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          if (field === "serviceName") {
            const selectedService = serviceCatalog.find(
              (s) => s.name === value
            );
            updatedItem.amount = selectedService ? selectedService.amount : 0;
          }
          return updatedItem;
        }
        return item;
      });
      const newSubtotal = calculateTotal(newCart);
      const discountAmmount = state.activeDiscount?.amount || 0;
      return {
        cart: newCart,
        subTotal: newSubtotal,
        totalPrice: newSubtotal - discountAmmount,
      };
    }),

  applyDiscount: (code) => {
    const { discountOption } = useServiceCatalogStore.getState();
    const { subTotal } = get();

    const foundDiscount = discountOption.find(
      (d) => d.code.toUpperCase() === code.toUpperCase()
    );

    if (foundDiscount) {
      set({
        activeDiscount: foundDiscount,
        totalPrice: subTotal - foundDiscount.amount,
      });
      return true;
    }
    return false;
  },

  removeDiscount: () =>
    set((state) => ({ activeDiscount: null, totalPrice: state.subTotal })),

  handleSubmit: async () => {
    const { cart, subTotal, activeDiscount, totalPrice, invoice, payment } =
      get();
    const { activeCustomer } = useCustomerStore.getState();

    if (!activeCustomer) {
      toast.error("Data customer tidak ditemukan.");
      return false;
    }
    if (cart.some((item) => !item.shoeName || !item.serviceName)) {
      toast.error("Harap isi semua detail item (nama sepatu dan layanan).");
      return false;
    }

    const supabase = createClient();
    let customerIdToUse = activeCustomer.customer_id;

    try {
      // Jika customer baru, INSERT datanya terlebih dahulu
      if (activeCustomer.isNew) {
        const { data, error } = await supabase
          .from("customers")
          .insert({
            customer_id: activeCustomer.customer_id,
            username: activeCustomer.username,
            whatsapp: activeCustomer.whatsapp,
            email: activeCustomer.email,
            alamat: activeCustomer.alamat,
          })
          .select("customer_id")
          .single();

        if (error) throw new Error(`Gagal insert customer: ${error.message}`);
        customerIdToUse = data.customer_id;
      }

      // 1. Insert ke tabel 'orders'
      const { error: orderError } = await supabase.from("orders").insert({
        invoice_id: invoice,
        customer_id: customerIdToUse,
        subtotal: subTotal,
        discount_id: activeDiscount?.code || null,
        total_price: totalPrice,
        payment: payment, // Gunakan state payment
      });

      if (orderError)
        throw new Error(`Gagal menyimpan order: ${orderError.message}`);

      // 2. Insert ke tabel 'order_item'
      const itemsToInsert = cart.map((item) => ({
        invoice_id: invoice,
        shoe_name: item.shoeName,
        service: item.serviceName,
        amount: item.amount,
      }));

      const { error: itemsError } = await supabase
        .from("order_item")
        .insert(itemsToInsert);

      if (itemsError)
        throw new Error(`Gagal menyimpan item: ${itemsError.message}`);

      return true; // Sinyal sukses
    } catch (error) {
      console.error("Proses submit gagal:", error);
      toast.error((error as Error).message);
      return false; // Sinyal gagal
    }
  },

  resetCart: () =>
    set({
      invoice: "",
      cart: [{ ...empatyService, id: Date.now() }],
      subTotal: 0,
      activeDiscount: null,
      totalPrice: 0,
      payment: "Cash",
    }),

  resetItems: () => set({ cart: [{ ...empatyService, id: Date.now() }] }),
}));
