// File: lib/invoiceUtils.ts

import { formatedCurrency } from "@/lib/utils";
// Impor tipe data yang sudah Anda definisikan
import { ICustomers, IItems } from "@/types";

interface InvoiceData {
  customer: ICustomers;
  invoice: string;
  cart: IItems[]; // Menggunakan tipe IItems[]
  subTotal: number;
  totalPrice: number;
  payment: string;
}

export const generateReceiptText = ({
  customer,
  invoice,
  cart,
  subTotal,
  totalPrice,
  payment,
}: InvoiceData): string => {
  let receiptText = `Hallo kak *${customer?.username}*\n\n`;
  receiptText += `Berikut Invoice Order\n\n`;
  receiptText += `Invoice No. *${invoice}*\n`;
  receiptText += `Tanggal: ${new Date().toLocaleDateString("id-ID")}\n`;
  receiptText += `-----------------------------------\n\n`;
  receiptText += `*Detail Service:*\n\n`;

  // Sesuaikan dengan properti dari tipe IItems
  cart.forEach((item) => {
    // PERUBAHAN: item.shoe_name dan item.service
    receiptText += `*${item.shoe_name}*\n`;
    // PERUBAHAN: parseFloat(item.amount) karena tipenya string
    receiptText += `${item.service} - ${formatedCurrency(
      parseFloat(item.amount)
    )}\n\n`;
  });

  receiptText += `\n-----------------------------------\n`;
  receiptText += `Subtotal: ${formatedCurrency(subTotal)} \n`;
  receiptText += `*Total Pembayaran: ${formatedCurrency(totalPrice)}*\n`;
  receiptText += `Metode Pembayaran: ${payment}\n\n`;
  receiptText += `\n-----------------------------------\n\n`;
  receiptText += `Tracking Order kamu di: \n`;
  receiptText += `https://inspirasinee.vercel.app/tracking/${invoice}\n`;
  receiptText += `Terimakasih atas Kepercayaannya`;

  return receiptText;
};
