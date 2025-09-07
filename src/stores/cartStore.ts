import { create } from "zustand";
import { useServiceCatalogStore, Discount } from "./serviceCatalogStore";
import { createClient } from "@/utils/supabase/client";
import { useCustomerStore } from "./customerStore";
import { toast } from "sonner";

// Antarmuka untuk item di dalam keranjang
interface CartItem {
  id: number;
  shoeName: string;
  serviceName: string;
  amount: number;
}

// Fungsi untuk menghitung ulang subtotal dan total harga
const recalculateTotals = (cart: CartItem[], activeDiscounts: Discount[]) => {
  const subTotal = cart.reduce((total, item) => total + item.amount, 0);

  const totalDiscountValue = activeDiscounts.reduce((total, discount) => {
    if (discount.percent) {
      // DIBULATKAN: Hasil diskon persen dibulatkan sebelum dijumlahkan
      const discountValue = Math.round(subTotal * discount.percent);
      return total + discountValue;
    }
    if (discount.amount) {
      return total + discount.amount;
    }
    return total;
  }, 0);

  // DIBULATKAN: Harga total akhir juga dibulatkan
  const totalPrice = Math.round(Math.max(0, subTotal - totalDiscountValue));
  return { subTotal, totalPrice };
};

// Antarmuka untuk state dari cart store
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

// Objek kosong sebagai template untuk item baru
const emptyService: Omit<CartItem, "id"> = {
  shoeName: "",
  serviceName: "",
  amount: 0,
};

export const useCartStore = create<CartState>((set, get) => ({
  // State awal
  invoice: "",
  cart: [{ ...emptyService, id: Date.now() }],
  subTotal: 0,
  activeDiscounts: [],
  totalPrice: 0,
  payment: "Cash",

  // Aksi-aksi (actions)
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
      let customerIdToUse = activeCustomer.customer_id;

      if (activeCustomer.isNew) {
        toast.info("Menyimpan data pelanggan baru...");
        const { isNew, ...customerToInsert } = activeCustomer;
        const { data: newCustomer, error: customerInsertError } = await supabase
          .from("customers")
          .insert(customerToInsert)
          .select("customer_id")
          .single();

        if (customerInsertError) {
          throw new Error(
            `Gagal menyimpan pelanggan baru: ${customerInsertError.message}`
          );
        }
        customerIdToUse = newCustomer.customer_id;
      }

      await supabase.from("orders").insert({
        invoice_id: invoice,
        status: "ongoing",
        customer_id: customerIdToUse,
        subtotal: subTotal, // subTotal sudah pasti integer
        total_price: totalPrice, // totalPrice sudah dibulatkan
        payment: payment,
      });

      if (activeDiscounts.length > 0) {
        const discountsToInsert = activeDiscounts.map((discount) => {
          // DIBULATKAN: Pastikan nilai yang dikirim ke DB juga bulat
          const appliedAmount = discount.percent
            ? Math.round(subTotal * discount.percent)
            : discount.amount || 0;

          return {
            order_invoice_id: invoice,
            discount_code: discount.label,
            discounted_amount: appliedAmount,
          };
        });

        await supabase.from("order_discounts").insert(discountsToInsert);
      }

      const itemsToInsert = cart.map((item) => ({
        invoice_id: invoice,
        shoe_name: item.shoeName,
        service: item.serviceName,
        amount: item.amount,
      }));

      await supabase.from("order_item").insert(itemsToInsert);

      return true;
    } catch (error) {
      const errorMessage = (error as Error).message;
      toast.error(errorMessage);
      console.error("Error saat submit:", errorMessage);
      // Rollback logic could be added here if needed
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
