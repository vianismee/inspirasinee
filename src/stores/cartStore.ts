import { create } from "zustand";
import { Discount } from "./serviceCatalogStore";
import { OrderService, OrderItemService, CustomerService, DiscountService, MembershipService } from "@/lib/client-services";
import { useCustomerStore } from "./customerStore";
import { toast } from "sonner";
import { logger } from "@/utils/client/logger";
import { createClient } from "@/utils/supabase/client";

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
  pointsDiscount: number = 0,
  membershipDiscount: number = 0,
  shinePointsDiscount: number = 0
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

  const totalPrice = Math.round(Math.max(0, subTotal - totalDiscountValue - referralDiscount - pointsDiscount - membershipDiscount - shinePointsDiscount));
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
  // Membership state
  membershipDiscount: number;
  membershipLevel: string | null;
  membershipLevelId: number | null;
  membershipLevelData: {
    id: number;
    name: string;
    level_index: number;
    discount_percent: number;
    discount_max_amount: number;
    transaction_threshold: number;
    is_active: boolean;
  } | null; // Full membership level data
  // Shine Points Redemption state
  shinePointsUsed: number;
  shinePointsDiscount: number;
  customerId: string | null; // Track current customer for recalculation
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
  // Membership methods
  setMembershipLevel: (level: string, levelId: number, levelData: {
    id: number;
    name: string;
    level_index: number;
    discount_percent: number;
    discount_max_amount: number;
    transaction_threshold: number;
    is_active: boolean;
  } | null) => void;
  setMembershipDiscount: (amount: number, level: string, levelId: number) => void;
  clearMembershipDiscount: () => void;
  fetchAndApplyMembershipDiscount: (customerId: string) => Promise<void>;
  recalculateMembershipDiscount: () => Promise<void>;
  // Shine Points Redemption methods
  setShinePointsUsed: (points: number) => void;
  setShinePointsDiscount: (amount: number) => void;
  clearShinePointsDiscount: () => void;
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
  // Membership state
  membershipDiscount: 0,
  membershipLevel: null,
  membershipLevelId: null,
  membershipLevelData: null,
  // Shine Points Redemption state
  shinePointsUsed: 0,
  shinePointsDiscount: 0,
  customerId: null,

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
      state.pointsDiscount,
      state.membershipDiscount,
      state.shinePointsDiscount
    );
    set({ referralDiscount: amount, totalPrice });
  },
  clearReferralDiscount: () => {
    const state = get();
    const { totalPrice } = recalculateTotals(
      state.cart,
      state.activeDiscounts,
      0,
      state.pointsDiscount,
      state.membershipDiscount,
      state.shinePointsDiscount
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
      amount,
      state.membershipDiscount,
      state.shinePointsDiscount
    );
    set({ pointsDiscount: amount, totalPrice });
  },
  clearPointsDiscount: () => {
    const state = get();
    const { totalPrice } = recalculateTotals(
      state.cart,
      state.activeDiscounts,
      state.referralDiscount,
      0,
      state.membershipDiscount,
      state.shinePointsDiscount
    );
    set({ pointsUsed: 0, pointsDiscount: 0, totalPrice });
  },

  // Membership methods
  setMembershipLevel: (level, levelId, levelData) => {
    set({ membershipLevel: level, membershipLevelId: levelId, membershipLevelData: levelData });
  },

  setMembershipDiscount: (amount, level, levelId) => {
    const state = get();
    const { totalPrice } = recalculateTotals(
      state.cart,
      state.activeDiscounts,
      state.referralDiscount,
      state.pointsDiscount,
      amount,
      state.shinePointsDiscount
    );
    set({ membershipDiscount: amount, membershipLevel: level, membershipLevelId: levelId, totalPrice });
  },

  clearMembershipDiscount: () => {
    const state = get();
    const { totalPrice } = recalculateTotals(
      state.cart,
      state.activeDiscounts,
      state.referralDiscount,
      state.pointsDiscount,
      0
    );
    set({ membershipDiscount: 0, totalPrice });
    // Keep level info, just clear discount
  },

  fetchAndApplyMembershipDiscount: async (customerId: string) => {
    try {
      // Store customer ID for later recalculation
      set({ customerId });

      // First, fetch the customer's membership level info (even if discount is 0)
      const membership = await MembershipService.getCustomerMembership(customerId);

      if (membership && membership.level) {
        get().setMembershipLevel(
          membership.level.name,
          membership.level.id,
          membership.level
        );
        logger.info("Membership level fetched", { customerId, level: membership.level.name }, "CartStore");
      }

      // Get current subtotal for calculation
      const state = get();
      const subTotal = state.cart.reduce((total, item) => {
        const itemTotal = item.services.reduce(
          (itemSum, service) => itemSum + service.amount,
          0
        );
        return total + itemTotal;
      }, 0);

      // Only calculate discount if there's a subtotal
      if (subTotal > 0) {
        // Calculate membership discount
        const result = await MembershipService.calculateMembershipDiscount(customerId, subTotal);

        if (result.applied && result.discount > 0) {
          get().setMembershipDiscount(result.discount, result.level || "", result.levelId || 0);
          logger.info("Membership discount applied", { customerId, discount: result.discount, level: result.level }, "CartStore");
        } else {
          // Clear discount but keep level info
          set({ membershipDiscount: 0 });
          logger.debug("No membership discount applied", { customerId, result }, "CartStore");
        }
      }
    } catch (error) {
      logger.error("Error fetching membership discount", { error, customerId }, "CartStore");
      // Don't throw - allow order to proceed without membership discount
    }
  },

  recalculateMembershipDiscount: async () => {
    const state = get();
    if (!state.customerId) return;

    try {
      const subTotal = state.cart.reduce((total, item) => {
        const itemTotal = item.services.reduce(
          (itemSum, service) => itemSum + service.amount,
          0
        );
        return total + itemTotal;
      }, 0);

      if (subTotal > 0 && state.membershipLevelData) {
        const level = state.membershipLevelData;
        const discountPercent = level.discount_percent || 0;
        const maxAmount = level.discount_max_amount || 0;

        if (discountPercent > 0) {
          const calculatedDiscount = Math.min(
            Math.floor(subTotal * (discountPercent / 100)),
            maxAmount
          );

          const { totalPrice } = recalculateTotals(
            state.cart,
            state.activeDiscounts,
            state.referralDiscount,
            state.pointsDiscount,
            calculatedDiscount,
            state.shinePointsDiscount
          );

          set({ membershipDiscount: calculatedDiscount, totalPrice });
          logger.info("Membership discount recalculated", { discount: calculatedDiscount, level: level.name }, "CartStore");
        }
      }
    } catch (error) {
      logger.error("Error recalculating membership discount", { error }, "CartStore");
    }
  },

  // Shine Points Redemption methods
  setShinePointsUsed: (points) => set({ shinePointsUsed: points }),
  setShinePointsDiscount: (amount) => {
    const state = get();
    const { totalPrice } = recalculateTotals(
      state.cart,
      state.activeDiscounts,
      state.referralDiscount,
      state.pointsDiscount,
      state.membershipDiscount,
      amount
    );
    set({ shinePointsDiscount: amount, totalPrice });
  },
  clearShinePointsDiscount: () => {
    const state = get();
    const { totalPrice } = recalculateTotals(
      state.cart,
      state.activeDiscounts,
      state.referralDiscount,
      state.pointsDiscount,
      state.membershipDiscount,
      0
    );
    set({ shinePointsUsed: 0, shinePointsDiscount: 0, totalPrice });
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
        state.pointsDiscount,
        state.membershipDiscount,
        state.shinePointsDiscount
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
        state.pointsDiscount,
        state.membershipDiscount,
        state.shinePointsDiscount
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
        state.pointsDiscount,
        state.membershipDiscount,
        state.shinePointsDiscount
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
        state.pointsDiscount,
        state.membershipDiscount,
        state.shinePointsDiscount
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
        state.pointsDiscount,
        state.membershipDiscount,
        state.shinePointsDiscount
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
      pointsDiscount,
      membershipDiscount,
      membershipLevelId,
      shinePointsUsed,
      shinePointsDiscount
    } = get();

    // Debug: Log current state
    logger.debug("Cart state before submit", {
      cartItems: cart.length,
      subTotal,
      totalPrice,
      invoice,
      payment
    }, "CartStore");
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

    // Validasi subtotal
    if (!subTotal || subTotal <= 0) {
      toast.error("Subtotal tidak valid. Pastikan ada layanan yang dipilih.");
      logger.error("Invalid subtotal", { subTotal }, "CartStore");
      return false;
    }

    try {
      const supabase = createClient();
      let customerIdToUse = activeCustomer.customer_id;

      if (activeCustomer.isNew) {
        toast.info("Menyimpan data pelanggan baru...");
        const { isNew: _isNew, ...customerToInsert } = activeCustomer;
        const newCustomer = await CustomerService.createCustomer(customerToInsert);

        if (!newCustomer) {
          throw new Error("Gagal menyimpan pelanggan baru");
        }
        customerIdToUse = newCustomer.customer_id;
      }

      // Build base order data
      const orderData: any = {
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
        membership_discount_amount: membershipDiscount || 0,
        membership_level_id: membershipLevelId || null,
      };

      // Conditionally add shine_points_discount_amount only if there's a discount
      // This prevents 400 error if the column doesn't exist in the database yet
      if (shinePointsDiscount && shinePointsDiscount > 0) {
        orderData.shine_points_discount_amount = shinePointsDiscount;
      }

      // Debug: Log order data
      logger.debug("Order data to be saved", { orderData }, "CartStore");

      const order = await OrderService.createOrder(orderData);
      if (!order) {
        throw new Error("Gagal membuat order");
      }

      if (activeDiscounts.length > 0) {
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

        // Save discounts to order_discounts table
        try {
          const { error: discountsError } = await supabase
            .from('order_discounts')
            .insert(discountsToInsert);

          if (discountsError) {
            logger.error("Failed to save order discounts", { error: discountsError, discountsToInsert }, "CartStore");
            // Continue with order creation even if discounts fail to save
          } else {
            logger.info("Order discounts saved successfully", { count: discountsToInsert.length }, "CartStore");
          }
        } catch (error) {
          logger.error("Exception saving order discounts", { error, discountsToInsert }, "CartStore");
          // Continue with order creation even if discounts fail to save
        }
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

      const orderItems = await OrderItemService.createOrderItems(itemsToInsert);
      if (!orderItems) {
        throw new Error("Gagal menyimpan order items");
      }

      // Record referral usage and award points if referral was used
      // Also handle points deduction if points were used
      if (referralCode && referralCode.trim()) {
        try {
          const { ReferralService } = await import("@/lib/client-services");

          logger.info("Recording referral usage for successful transaction", { referralCode, invoice }, "CartStore");

          // Record referral usage and award points to referrer
          const referralResult = await ReferralService.recordReferralAndAwardPoints(
            referralCode.trim(),
            customerIdToUse,
            invoice,
            referralDiscount
          );

          if (referralResult.success) {
            toast.success(`Referral bonus recorded! Referrer earned ${referralResult.pointsAwarded} points`);
            logger.info("Referral recorded successfully", { referralResult }, "CartStore");
          } else {
            const errorMsg = (referralResult as { error?: string; message?: string }).error ||
                           (referralResult as { error?: string; message?: string }).message ||
                           'Unknown error';
            logger.error("Referral recording failed", { errorMsg, referralResult }, "CartStore");
            toast.warning(`Order successful, but referral recording failed: ${errorMsg}`);
          }

          if (pointsUsed && pointsUsed > 0) {
            // Handle points deduction for the customer who used points
            const { PointsService } = await import("@/lib/client-services");
            await PointsService.deductPoints(
              customerIdToUse,
              pointsUsed,
              'order',
              invoice,
              `Points used for order ${invoice}`
            );
            toast.success(`Points deducted! You used ${pointsUsed} points`);
          }

          // Handle shine points deduction
          if (shinePointsUsed && shinePointsUsed > 0) {
            const { ShinePointsService } = await import("@/lib/client-services");
            await ShinePointsService.deductShinePoints(
              customerIdToUse,
              shinePointsUsed,
              'order',
              invoice,
              `Shine points used for order ${invoice}`
            );
            toast.success(`Shine points deducted! You used ${shinePointsUsed} shine points`);
          }
        } catch (error) {
          logger.error("Error recording referral usage", { error, referralCode, invoice }, "CartStore");
          toast.warning("Order successful, but referral recording failed");
        }
      } else {
        // Handle points deduction even if no referral code was used
        if (pointsUsed && pointsUsed > 0) {
          try {
            const { PointsService } = await import("@/lib/client-services");
            await PointsService.deductPoints(
              customerIdToUse,
              pointsUsed,
              'order',
              invoice,
              `Points used for order ${invoice}`
            );
            toast.success(`Points deducted! You used ${pointsUsed} points`);
          } catch (error) {
            logger.error("Error deducting points", { error, pointsUsed, invoice }, "CartStore");
            toast.warning("Order successful, but points deduction failed");
          }
        }

        // Handle shine points deduction even if no referral code was used
        if (shinePointsUsed && shinePointsUsed > 0) {
          try {
            const { ShinePointsService } = await import("@/lib/client-services");
            await ShinePointsService.deductShinePoints(
              customerIdToUse,
              shinePointsUsed,
              'order',
              invoice,
              `Shine points used for order ${invoice}`
            );
            toast.success(`Shine points deducted! You used ${shinePointsUsed} shine points`);
          } catch (error) {
            logger.error("Error deducting shine points", { error, shinePointsUsed, invoice }, "CartStore");
            toast.warning("Order successful, but shine points deduction failed");
          }
        }
      }

      // Trigger points refresh for components to update their display
      try {
        const { usePointsRefreshStore } = await import("@/hooks/use-points-refresh");
        usePointsRefreshStore.getState().triggerRefresh();
      } catch (error) {
        // Ignore if store doesn't exist yet
      }

      return true;
    } catch (error) {
      const errorMessage = (error as Error).message;
      toast.error(errorMessage);
      logger.error("Error saat submit", { error, errorMessage }, "CartStore");
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
      // Reset membership state
      membershipDiscount: 0,
      membershipLevel: null,
      membershipLevelId: null,
      membershipLevelData: null,
      // Reset shine points state
      shinePointsUsed: 0,
      shinePointsDiscount: 0,
      customerId: null,
    }),
}));
