import { create } from "zustand";

const SERVICE = [
  { name: "Express Cleaning (1 Day)", amount: 50000 },
  { name: "Deep Cleaning (3 Day)", amount: 35000 },
  { name: "Whitening Cleaning (4 Day)", amount: 45000 },
  { name: "Kids Shoe Treatment (3 Day)", amount: 30000 },
  { name: "Woman Shoe Treatment (3 Day)", amount: 30000 },
];

interface Discount {
  label: string;
  amount: number;
  code: string;
}
const DISCOUNT_OPTIONS: Discount[] = [
  {
    label: "Diskon Kemerdekaan",
    amount: 17000,
    code: "MERDEKA17",
  },
  {
    label: "Member Only Diskon",
    amount: 8000,
    code: "MEMBERAGS",
  },
];

interface CartItem {
  id: number;
  shoeName: string;
  serviceName: string;
  amount: number;
}

interface CartState {
  cart: CartItem[];
  subTotal: number;
  activeDiscount: Discount | null;
  totalPrice: number;
  addItem: () => void;
  updateItem: (
    id: number,
    field: keyof CartItem,
    value: string | number
  ) => void;
  removeItem: (id: number) => void;
  applyDiscount: (code: string) => void;
  removeDiscount: () => void;
}

const empatyService: Omit<CartItem, "id"> = {
  shoeName: "",
  serviceName: "",
  amount: 0,
};

const calculateTotal = (cart: CartItem[]) => {
  return cart.reduce((total, item) => total + item.amount, 0);
};

export const useCartStore = create<CartState>((set) => ({
  cart: [{ ...empatyService, id: Date.now() }],
  subTotal: 0,
  activeDiscount: null,
  totalPrice: 0,

  addItem: () =>
    set((state) => {
      const newCart = [...state.cart, { ...empatyService, id: Date.now() }];
      return {
        cart: newCart,
        subTotal: calculateTotal(newCart), // Hitung ulang total
      };
    }),

  removeItem: (id) =>
    set((state) => {
      if (state.cart.length <= 1) return state;
      const newCart = state.cart.filter((item) => item.id !== id);
      return {
        cart: newCart,
        subTotal: calculateTotal(newCart), // Hitung ulang total
      };
    }),

  updateItem: (id, field, value) =>
    set((state) => {
      const newCart = state.cart.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          if (field === "serviceName") {
            const selectedService = SERVICE.find((s) => s.name === value);
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
    const foundDiscount = DISCOUNT_OPTIONS.find(
      (d) => d.code.toUpperCase() === code.toUpperCase()
    );

    if (foundDiscount) {
      set((state) => ({
        activeDiscount: foundDiscount,
        totalPrice: state.subTotal - foundDiscount.amount,
      }));
      return true;
    }

    return false;
  },

  removeDiscount: () =>
    set((state) => ({ activeDiscount: null, totalPrice: state.subTotal })),
}));
