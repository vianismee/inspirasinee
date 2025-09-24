import { create } from "zustand";
import { useServiceCatalogStore, Discount } from "./serviceCatalogStore";
import { createClient } from "@/utils/supabase/client";
import { useCustomerStore } from "./customerStore";
import { useReferralStore } from "./referralStore";
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
const recalculateTotals = (cart: CartItem[], activeDiscounts: Discount[], referralDiscount?: number, pointsDiscount?: number) => {
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

  const totalReferralDiscount = referralDiscount || 0;
  const totalPointsDiscount = pointsDiscount || 0;
  const totalPrice = Math.round(Math.max(0, subTotal - totalDiscountValue - totalReferralDiscount - totalPointsDiscount));
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
  referralDiscount?: number;
  pointsUsed?: number;
  pointsDiscount?: number;
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
  setReferralDiscount: (amount: number) => void;
  setPointsUsed: (points: number) => void;
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
  referralDiscount: 0,
  pointsUsed: 0,
  pointsDiscount: 0,

  // Aksi-aksi (actions)
  setInvoice: (id) => set({ invoice: id }),
  setPayment: (payment) => set({ payment }),

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
      const totals = recalculateTotals(newCart, state.activeDiscounts, state.referralDiscount, state.pointsDiscount);
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
      const totals = recalculateTotals(newCart, state.activeDiscounts, state.referralDiscount, state.pointsDiscount);
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
      const totals = recalculateTotals(newCart, state.activeDiscounts, state.referralDiscount, state.pointsDiscount);
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
      const { totalPrice } = recalculateTotals(state.cart, newActiveDiscounts, state.referralDiscount, state.pointsDiscount);
      toast.success(`Diskon "${discount.label}" berhasil diterapkan.`);
      return { activeDiscounts: newActiveDiscounts, totalPrice };
    }),

  removeDiscount: (discountName) =>
    set((state) => {
      // ... logika ini tidak berubah ...
      const newActiveDiscounts = state.activeDiscounts.filter(
        (d) => d.label !== discountName
      );
      const { totalPrice } = recalculateTotals(state.cart, newActiveDiscounts, state.referralDiscount, state.pointsDiscount);
      toast.info(`Diskon "${discountName}" telah dihapus.`);
      return { activeDiscounts: newActiveDiscounts, totalPrice };
    }),

  setReferralDiscount: (amount) =>
    set((state) => {
      const { totalPrice } = recalculateTotals(state.cart, state.activeDiscounts, amount, state.pointsDiscount);
      return { referralDiscount: amount, totalPrice };
    }),

  setPointsUsed: async (points) => {
    const { pointToRupiahConversionRate } = useReferralStore.getState();
    const pointsDiscount = points * pointToRupiahConversionRate;

    set((state) => {
      const { totalPrice } = recalculateTotals(state.cart, state.activeDiscounts, state.referralDiscount, pointsDiscount);
      return { pointsUsed: points, pointsDiscount, totalPrice };
    });
  },

  handleSubmit: async () => {
    const { cart, subTotal, activeDiscounts, totalPrice, invoice, payment, referralDiscount, pointsUsed, pointsDiscount } =
      get();
    const { activeCustomer } = useCustomerStore.getState();
    const { addPointsToCustomer, referrerPointsPerReferral } = useReferralStore.getState();

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
        const { isNew, referralCode, referralCodeValid, referralDiscountAmount, ...customerToInsert } = activeCustomer;
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

        // Initialize customer points for new customer
        const { data: pointsData, error: pointsError } = await supabase
          .from("customer_points")
          .insert({
            customer_id: customerIdToUse,
            points_balance: 0,
          });

        if (pointsError) {
          // Silently handle points initialization error
        }
      }

      const orderData: any = {
        invoice_id: invoice,
        status: "ongoing",
        customer_id: customerIdToUse,
        subtotal: subTotal,
        total_price: totalPrice,
        payment: payment,
      };

      // Add referral data if applicable
      if (activeCustomer.referralCodeValid && activeCustomer.referralCode) {
        orderData.referral_code_used = activeCustomer.referralCode;
        orderData.referral_discount_amount = activeCustomer.referralDiscountAmount || referralDiscount;
      }

      // Add points data if applicable
      if (pointsUsed && pointsUsed > 0) {
        orderData.points_used = pointsUsed;
        orderData.points_discount_amount = pointsDiscount;
      }

      await supabase.from("orders").insert(orderData);

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

      // Award referral points if applicable
      if (activeCustomer.referralCodeValid && activeCustomer.referralCode && activeCustomer.isNew) {
        // Ensure referrer has points record before awarding
        const { ensureCustomerPointsRecord } = useReferralStore.getState();
        await ensureCustomerPointsRecord(activeCustomer.referralCode);

        const success = await addPointsToCustomer(
          activeCustomer.referralCode,
          referrerPointsPerReferral,
          `Referral reward for new customer: ${activeCustomer.username}`,
          invoice,
          customerIdToUse
        );

        if (success) {
          toast.success(`${referrerPointsPerReferral} points awarded to referrer!`);
        } else {
          toast.error(`Failed to award ${referrerPointsPerReferral} points to referrer. Please contact support.`);
        }
      }

      // Deduct points if used
      if (pointsUsed && pointsUsed > 0 && !activeCustomer.isNew) {
        const { deductPointsFromCustomer } = useReferralStore.getState();
        const success = await deductPointsFromCustomer(
          customerIdToUse,
          pointsUsed,
          `Points used for order ${invoice}`,
          invoice
        );

        if (success) {
          toast.success(`${pointsUsed} points deducted from your balance.`);
        } else {
          toast.error(`Failed to deduct ${pointsUsed} points. Please contact support.`);
        }
      }

      return true;
    } catch (error) {
      const errorMessage = (error as Error).message;
      toast.error(errorMessage);
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
      referralDiscount: 0,
      pointsUsed: 0,
      pointsDiscount: 0,
    }),
}));
