import { ICustomers, IItems } from "@/types";
import { formatedCurrency } from "./utils";

// Interface untuk data yang dibutuhkan oleh fungsi
interface ReceiptData {
  customer: ICustomers;
  invoice: string;
  cart: IItems[];
  subTotal: number;
  totalPrice: number;
  payment: string;
  discounts?: {
    label: string;
    amount: number;
  }[];
}

export const generateReceiptText = ({
  customer,
  invoice,
  cart,
  subTotal,
  totalPrice,
  payment,
  discounts,
}: ReceiptData): string => {
  // Format tanggal menjadi D/M/YYYY
  const today = new Date();
  const formattedDate = `${today.getDate()}/${
    today.getMonth() + 1
  }/${today.getFullYear()}`;

  const greeting = `Hallo kak *${customer.username}*\n\nBerikut Invoice Order\n\n`;

  const invoiceDetails =
    `Invoice No. *${invoice}*\n` + `Tanggal: ${formattedDate}\n`;

  const separator = `-----------------------------------\n\n`;

  const orderDetailsHeader = `Detail Service:\n\n`;

  // BARU: Logika untuk mengelompokkan dan memformat detail order
  const groupedCart = cart.reduce((acc, item) => {
    if (!acc[item.shoe_name]) {
      acc[item.shoe_name] = [];
    }
    acc[item.shoe_name].push({
      service: item.service,
      amount: item.amount,
    });
    return acc;
  }, {} as Record<string, { service: string; amount: string }[]>);

  const orderDetails = Object.entries(groupedCart)
    .map(([shoeName, services]) => {
      const servicesText = services
        .map(
          (s) => `  - ${s.service} ${formatedCurrency(parseFloat(s.amount))}`
        )
        .join("\n");
      return `${shoeName}\n${servicesText}`;
    })
    .join("\n\n");

  const summaryHeader = `\n\n-----------------------------------\n`;
  const subTotalText = `Subtotal: ${formatedCurrency(subTotal)}`;

  // Logika untuk memformat setiap diskon
  const discountsText =
    discounts && discounts.length > 0
      ? "\n" +
        discounts
          .map((d) => `- ${d.label}: -${formatedCurrency(d.amount)}`)
          .join("\n")
      : "";

  const totalText = `\n*Total Pembayaran: ${formatedCurrency(totalPrice)}*`;
  const paymentMethod = `\nMetode Pembayaran: ${payment}`;

  const trackingInfo =
    `\n\n-----------------------------------\n\n` +
    `Tracking Order kamu di:\n` +
    `https://inspirasinee.vercel.app/tracking/${invoice}`;

  const footer = `\nTerimakasih atas Kepercayaannya`;

  return (
    greeting +
    invoiceDetails +
    separator +
    orderDetailsHeader +
    orderDetails +
    summaryHeader +
    subTotalText +
    discountsText +
    totalText +
    paymentMethod +
    trackingInfo +
    footer
  );
};
