// stores/cartStore.ts

import { create } from "zustand";
import { useServiceCatalogStore, Discount } from "./serviceCatalogStore"; // Impor interface Discount
import { createClient } from "@/utils/supabase/client";
import { useCustomerStore } from "./customerStore";
import { toast } from "sonner";

interface CartItem {
  id: number;
  shoeName: string;
  serviceName: string;
  amount: number;
}

// Fungsi helper terpusat untuk semua kalkulasi harga
const recalculateTotals = (cart: CartItem[], activeDiscounts: Discount[]) => {
  const subTotal = cart.reduce((total, item) => total + item.amount, 0);

  const totalDiscountValue = activeDiscounts.reduce((total, discount) => {
    if (discount.percent) {
      return total + subTotal * discount.percent;
    }
    if (discount.amount) {
      return total + discount.amount;
    }
    return total;
  }, 0);

  const totalPrice = Math.max(0, subTotal - totalDiscountValue);
  return { subTotal, totalPrice };
};

interface CartState {
  invoice: string;
  cart: CartItem[];
  subTotal: number;
  activeDiscounts: Discount[];
  totalPrice: number;
  payment: string;
  setPayment: (payment: string) => void;
  setInvoice: (id: string) => void;
  addItem: () => void;
  updateItem: (
    id: number,
    field: keyof CartItem,
    value: string | number
  ) => void;
  removeItem: (id: number) => void;
  addDiscount: (discount: Discount) => void;
  removeDiscount: (discountName: string) => void;
  handleSubmit: () => Promise<boolean>;
  resetCart: () => void;
}

const emptyService: Omit<CartItem, "id"> = {
  shoeName: "",
  serviceName: "",
  amount: 0,
};

export const useCartStore = create<CartState>((set, get) => ({
  invoice: "",
  cart: [{ ...emptyService, id: Date.now() }],
  subTotal: 0,
  activeDiscounts: [],
  totalPrice: 0,
  payment: "Cash",

  setInvoice: (id) => set({ invoice: id }),
  setPayment: (payment) => set({ payment }),

  addItem: () =>
    set((state) => {
      const newCart = [...state.cart, { ...emptyService, id: Date.now() }];
      const totals = recalculateTotals(newCart, state.activeDiscounts);
      return { cart: newCart, ...totals };
    }),

  removeItem: (id) =>
    set((state) => {
      if (state.cart.length <= 1) return state;
      const newCart = state.cart.filter((item) => item.id !== id);
      const totals = recalculateTotals(newCart, state.activeDiscounts);
      return { cart: newCart, ...totals };
    }),

  updateItem: (id, field, value) =>
    set((state) => {
      const { serviceCatalog } = useServiceCatalogStore.getState();
      const newCart = state.cart.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          if (field === "serviceName") {
            const service = serviceCatalog.find((s) => s.name === value);
            updatedItem.amount = service?.amount || 0;
          }
          return updatedItem;
        }
        return item;
      });
      const totals = recalculateTotals(newCart, state.activeDiscounts);
      return { cart: newCart, ...totals };
    }),

  addDiscount: (discount) =>
    set((state) => {
      if (state.activeDiscounts.some((d) => d.label === discount.label)) {
        toast.warning(`Diskon "${discount.label}" sudah diterapkan.`);
        return state;
      }
      const newActiveDiscounts = [...state.activeDiscounts, discount];
      const { totalPrice } = recalculateTotals(state.cart, newActiveDiscounts);
      toast.success(`Diskon "${discount.label}" berhasil diterapkan.`);
      return { activeDiscounts: newActiveDiscounts, totalPrice };
    }),

  removeDiscount: (discountName) =>
    set((state) => {
      const newActiveDiscounts = state.activeDiscounts.filter(
        (d) => d.label !== discountName
      );
      const { totalPrice } = recalculateTotals(state.cart, newActiveDiscounts);
      toast.info(`Diskon "${discountName}" telah dihapus.`);
      return { activeDiscounts: newActiveDiscounts, totalPrice };
    }),

  handleSubmit: async () => {
    const { cart, subTotal, activeDiscounts, totalPrice, invoice, payment } =
      get();
    const { activeCustomer } = useCustomerStore.getState();

    if (!activeCustomer) {
      toast.error("Data pelanggan belum dipilih.");
      return false;
    }
    if (cart.some((item) => !item.shoeName || !item.serviceName)) {
      toast.error(
        "Harap lengkapi semua detail item (nama sepatu dan layanan)."
      );
      return false;
    }

    const supabase = createClient();
    try {
      const discountsToSave =
        activeDiscounts.length > 0 ? JSON.stringify(activeDiscounts) : null;

      const { error: orderError } = await supabase.from("orders").insert({
        invoice_id: invoice,
        status: "ongoing",
        customer_id: activeCustomer.customer_id,
        subtotal: subTotal,
        discounts: discountsToSave, // Kolom untuk menyimpan array diskon
        total_price: totalPrice,
        payment: payment,
      });
      if (orderError)
        throw new Error(`Gagal menyimpan pesanan: ${orderError.message}`);

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
        throw new Error(`Gagal menyimpan item pesanan: ${itemsError.message}`);

      return true;
    } catch (error) {
      toast.error((error as Error).message);
      return false;
    }
  },

  resetCart: () =>
    set({
      invoice: "",
      cart: [{ ...emptyService, id: Date.now() }],
      subTotal: 0,
      activeDiscounts: [],
      totalPrice: 0,
      payment: "Cash",
    }),
}));
