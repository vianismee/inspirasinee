import { ICustomers, IDiscount, IItems } from "@/types";
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
  const orderDetails = cart
    .map(
      (item) =>
        `${item.shoe_name}\n` +
        `${item.service} - ${formatedCurrency(parseFloat(item.amount))}`
    )
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
