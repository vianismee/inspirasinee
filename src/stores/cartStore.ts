import { create } from "zustand";
import { Discount } from "./serviceCatalogStore";
import { createClient } from "@/utils/supabase/client";
import { useCustomerStore } from "./customerStore";
import { toast } from "sonner";

// BARU: Tipe data untuk satu layanan dalam item
export interface ServiceItem {
  name: string;
  amount: number;
}

// UBAH: Antarmuka untuk item di dalam keranjang
interface CartItem {
  id: number;
  shoeName: string;
  services: ServiceItem[]; // Setiap item punya array layanan
}

// UBAH: Fungsi untuk menghitung ulang subtotal dan total harga
const recalculateTotals = (
  cart: CartItem[],
  activeDiscounts: Discount[],
  referralDiscount: number = 0,
  pointsDiscount: number = 0
) => {
  // Hitung subtotal dengan menjumlahkan semua harga layanan di setiap item
  const subTotal = cart.reduce((total, item) => {
    const itemTotal = item.services.reduce(
      (itemSum, service) => itemSum + service.amount,
      0
    );
    return total + itemTotal;
  }, 0);

  const totalDiscountValue = activeDiscounts.reduce((total, discount) => {
    if (discount.percent) {
      const discountValue = Math.round(subTotal * discount.percent);
      return total + discountValue;
    }
    if (discount.amount) {
      return total + discount.amount;
    }
    return total;
  }, 0);

  const totalPrice = Math.round(Math.max(0, subTotal - totalDiscountValue - referralDiscount - pointsDiscount));
  return { subTotal, totalPrice };
};

// UBAH: Antarmuka untuk state dari cart store
interface CartState {
  invoice: string;
  cart: CartItem[];
  subTotal: number;
  activeDiscounts: Discount[];
  totalPrice: number;
  payment: string;
  // Referral state
  referralCode: string;
  referralDiscount: number;
  pointsUsed: number;
  pointsDiscount: number;
  // Existing methods
  setPayment: (payment: string) => void;
  setInvoice: (id: string) => void;
  addItem: () => void;
  // UBAH: updateItem hanya untuk shoeName
  updateItem: (id: number, field: "shoeName", value: string) => void;
  removeItem: (id: number) => void;
  // BARU: Aksi untuk menambah dan menghapus layanan
  addServiceToItem: (itemId: number, service: ServiceItem) => void;
  removeServiceFromItem: (itemId: number, serviceName: string) => void;
  addDiscount: (discount: Discount) => void;
  removeDiscount: (discountName: string) => void;
  // Referral methods
  setReferralCode: (code: string) => void;
  setReferralDiscount: (amount: number) => void;
  clearReferralDiscount: () => void;
  setPointsUsed: (points: number) => void;
  setPointsDiscount: (amount: number) => void;
  clearPointsDiscount: () => void;
  handleSubmit: () => Promise<boolean>;
  resetCart: () => void;
}

// UBAH: Objek kosong sebagai template untuk item baru
const emptyItem: Omit<CartItem, "id"> = {
  shoeName: "",
  services: [],
};

export const useCartStore = create<CartState>((set, get) => ({
  // UBAH: State awal
  invoice: "",
  cart: [{ ...emptyItem, id: Date.now() }],
  subTotal: 0,
  activeDiscounts: [],
  totalPrice: 0,
  payment: "Cash",
  // Referral state
  referralCode: "",
  referralDiscount: 0,
  pointsUsed: 0,
  pointsDiscount: 0,

  // Aksi-aksi (actions)
  setInvoice: (id) => set({ invoice: id }),
  setPayment: (payment) => set({ payment }),

  // Referral methods
  setReferralCode: (code) => set({ referralCode: code }),
  setReferralDiscount: (amount) => {
    const state = get();
    const { totalPrice } = recalculateTotals(
      state.cart,
      state.activeDiscounts,
      amount,
      state.pointsDiscount
    );
    set({ referralDiscount: amount, totalPrice });
  },
  clearReferralDiscount: () => {
    const state = get();
    const { totalPrice } = recalculateTotals(
      state.cart,
      state.activeDiscounts,
      0,
      state.pointsDiscount
    );
    set({ referralCode: "", referralDiscount: 0, totalPrice });
  },
  setPointsUsed: (points) => set({ pointsUsed: points }),
  setPointsDiscount: (amount) => {
    const state = get();
    const { totalPrice } = recalculateTotals(
      state.cart,
      state.activeDiscounts,
      state.referralDiscount,
      amount
    );
    set({ pointsDiscount: amount, totalPrice });
  },
  clearPointsDiscount: () => {
    const state = get();
    const { totalPrice } = recalculateTotals(
      state.cart,
      state.activeDiscounts,
      state.referralDiscount,
      0
    );
    set({ pointsUsed: 0, pointsDiscount: 0, totalPrice });
  },

  addItem: () =>
    set((state) => {
      const newCart = [...state.cart, { ...emptyItem, id: Date.now() }];
      // Kalkulasi tidak perlu di sini karena item baru harganya 0
      return { cart: newCart };
    }),

  removeItem: (id) =>
    set((state) => {
      if (state.cart.length <= 1) return state;
      const newCart = state.cart.filter((item) => item.id !== id);
      const totals = recalculateTotals(
        newCart,
        state.activeDiscounts,
        state.referralDiscount,
        state.pointsDiscount
      );
      return { cart: newCart, ...totals };
    }),

  // UBAH: updateItem disederhanakan hanya untuk shoeName
  updateItem: (id, field, value) =>
    set((state) => {
      const newCart = state.cart.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      });
      // Tidak perlu kalkulasi ulang karena nama sepatu tidak mengubah harga
      return { cart: newCart };
    }),

  // BARU: Aksi untuk menambah layanan ke item
  addServiceToItem: (itemId, service) =>
    set((state) => {
      const newCart = state.cart.map((item) => {
        if (item.id === itemId) {
          // Cek agar tidak ada layanan duplikat
          if (item.services.some((s) => s.name === service.name)) {
            toast.warning(`Layanan "${service.name}" sudah ada di item ini.`);
            return item;
          }
          const updatedServices = [...item.services, service];
          return { ...item, services: updatedServices };
        }
        return item;
      });
      const totals = recalculateTotals(
        newCart,
        state.activeDiscounts,
        state.referralDiscount,
        state.pointsDiscount
      );
      return { cart: newCart, ...totals };
    }),

  // BARU: Aksi untuk menghapus layanan dari item
  removeServiceFromItem: (itemId, serviceName) =>
    set((state) => {
      const newCart = state.cart.map((item) => {
        if (item.id === itemId) {
          const updatedServices = item.services.filter(
            (s) => s.name !== serviceName
          );
          return { ...item, services: updatedServices };
        }
        return item;
      });
      const totals = recalculateTotals(
        newCart,
        state.activeDiscounts,
        state.referralDiscount,
        state.pointsDiscount
      );
      return { cart: newCart, ...totals };
    }),

  addDiscount: (discount) =>
    set((state) => {
      // ... logika ini tidak berubah ...
      if (state.activeDiscounts.some((d) => d.label === discount.label)) {
        toast.warning(`Diskon "${discount.label}" sudah diterapkan.`);
        return state;
      }
      const newActiveDiscounts = [...state.activeDiscounts, discount];
      const { totalPrice } = recalculateTotals(
        state.cart,
        newActiveDiscounts,
        state.referralDiscount,
        state.pointsDiscount
      );
      toast.success(`Diskon "${discount.label}" berhasil diterapkan.`);
      return { activeDiscounts: newActiveDiscounts, totalPrice };
    }),

  removeDiscount: (discountName) =>
    set((state) => {
      // ... logika ini tidak berubah ...
      const newActiveDiscounts = state.activeDiscounts.filter(
        (d) => d.label !== discountName
      );
      const { totalPrice } = recalculateTotals(
        state.cart,
        newActiveDiscounts,
        state.referralDiscount,
        state.pointsDiscount
      );
      toast.info(`Diskon "${discountName}" telah dihapus.`);
      return { activeDiscounts: newActiveDiscounts, totalPrice };
    }),

  handleSubmit: async () => {
    const {
      cart,
      subTotal,
      activeDiscounts,
      totalPrice,
      invoice,
      payment,
      referralCode,
      referralDiscount,
      pointsUsed,
      pointsDiscount
    } = get();
    const { activeCustomer } = useCustomerStore.getState();

    if (!activeCustomer) {
      toast.error("Data pelanggan belum dipilih.");
      return false;
    }
    // UBAH: Validasi baru, cek jika ada item tanpa layanan
    if (cart.some((item) => !item.shoeName || item.services.length === 0)) {
      toast.error(
        "Harap lengkapi semua detail item (nama sepatu dan minimal satu layanan)."
      );
      return false;
    }

    const supabase = createClient();
    try {
      let customerIdToUse = activeCustomer.customer_id;

      if (activeCustomer.isNew) {
        // ... logika simpan customer baru tidak berubah ...
        toast.info("Menyimpan data pelanggan baru...");
        const { isNew: _isNew, ...customerToInsert } = activeCustomer;
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
        subtotal: subTotal,
        total_price: totalPrice,
        payment: payment,
        referral_code: referralCode || null,
        referral_discount_amount: referralDiscount,
        points_used: pointsUsed,
        points_discount_amount: pointsDiscount,
      });

      if (activeDiscounts.length > 0) {
        // ... logika simpan diskon tidak berubah ...
        const discountsToInsert = activeDiscounts.map((discount) => {
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

      // UBAH: Logika untuk menyimpan item ke tabel order_item
      // Kita "ratakan" (flatten) data dari keranjang.
      // Satu item dengan 3 layanan akan menjadi 3 baris di database.
      const itemsToInsert = cart.flatMap((item) =>
        item.services.map((service) => ({
          invoice_id: invoice,
          shoe_name: item.shoeName,
          service: service.name,
          amount: service.amount,
        }))
      );

      await supabase.from("order_item").insert(itemsToInsert);

      // Record referral usage and award points if referral was used
      // Also handle points deduction if points were used
      if (referralCode && referralCode.trim()) {
        try {
          
          const response = await fetch("/api/referral/record", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              referralCode: referralCode.trim(),
              customerId: customerIdToUse,
              orderInvoiceId: invoice,
              pointsUsed: pointsUsed,
              pointsDiscount: pointsDiscount
            }),
          });

          if (response.ok) {
            const result = await response.json();
                        let successMessage = "Referral bonus recorded successfully!";
            if (pointsUsed && pointsUsed > 0) {
              successMessage += ` Points deducted: ${pointsUsed} points`;
            }
            toast.success(successMessage);
          } else {
            const errorText = await response.text();
            console.error("Failed to record referral usage:", response.status, errorText);
            toast.warning("Order successful, but referral recording failed");
          }
        } catch (error) {
          console.error("Error recording referral usage:", error);
          toast.warning("Order successful, but referral recording failed");
        }
      } else if (pointsUsed && pointsUsed > 0) {
        // Handle points deduction even if no referral code was used
        try {
          
          const response = await fetch("/api/points/deduct", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              customerId: customerIdToUse,
              pointsToDeduct: pointsUsed,
              orderId: invoice
            }),
          });

          if (response.ok) {
            const result = await response.json();
                        toast.success(`Points deducted! You used ${pointsUsed} points`);
          } else {
            const errorText = await response.text();
            console.error("Failed to deduct points:", response.status, errorText);
            toast.warning("Order successful, but points deduction failed");
          }
        } catch (error) {
          console.error("Error deducting points:", error);
          toast.warning("Order successful, but points deduction failed");
        }
      }

      return true;
    } catch (error) {
      const errorMessage = (error as Error).message;
      toast.error(errorMessage);
      console.error("Error saat submit:", errorMessage);
      return false;
    }
  },

  resetCart: () =>
    set({
      invoice: "",
      cart: [{ ...emptyItem, id: Date.now() }], // UBAH
      subTotal: 0,
      activeDiscounts: [],
      totalPrice: 0,
      payment: "Cash",
      referralCode: "",
      referralDiscount: 0,
      pointsUsed: 0,
      pointsDiscount: 0,
    }),
}));
