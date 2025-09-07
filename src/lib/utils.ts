import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatedCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatPhoneNumber = (phone: string | null | undefined): string => {
  // Jika nomor tidak ada atau terlalu pendek, kembalikan teks default
  if (!phone || phone.length < 4) {
    return "Nomor tidak valid";
  }
  const lastFourDigits = phone.slice(-4);
  return `******${lastFourDigits}`;
};
