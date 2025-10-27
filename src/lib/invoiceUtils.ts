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
  referralCode?: string;
  referralDiscount?: number;
  pointsUsed?: number;
  pointsDiscount?: number;
}

export const generateReceiptText = ({
  customer,
  invoice,
  cart,
  subTotal,
  totalPrice,
  payment,
  discounts,
  referralCode,
  referralDiscount,
  pointsUsed,
  pointsDiscount,
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
  let discountLines: string[] = [];

  // Regular discounts
  if (discounts && discounts.length > 0) {
    discountLines.push(...discounts.map((d) => `- ${d.label}: -${formatedCurrency(d.amount)}`));
  }

  // Referral discount
  if (referralCode && referralDiscount && referralDiscount > 0) {
    discountLines.push(`- 💰 Referral (${referralCode}): -${formatedCurrency(referralDiscount)}`);
  }

  // Points redemption
  if (pointsUsed && pointsUsed > 0 && pointsDiscount && pointsDiscount > 0) {
    discountLines.push(`- 🎯 Poin (${pointsUsed} poin): -${formatedCurrency(pointsDiscount)}`);
  }

  const discountsText = discountLines.length > 0 ? "\n" + discountLines.join("\n") : "";

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

export const ContactCs = (invoice: string) => {
  const greeting = `Hallo Min, saya mau bertanya terkait pesanan dengan nomor invoice *${invoice}*.`;
  const separator = `\n-----------------------------------\n\n`;
  const questionPlaceholder = `[Silakan ketik pertanyaan atau keluhan Anda di sini]\n\n`;
  const closing = `Terima kasih.`;

  return greeting + separator + questionPlaceholder + closing;
};

export const generateComplaintText = (invoice: string) => {
  const header = `*[KELUHAN PELANGGAN]*\n\n`;
  const intro = `Admin INSPIRASINEE,\n\nSaya ingin mengajukan keluhan terkait pesanan dengan nomor invoice berikut:`;
  const invoiceDetail = `\n\n*Nomor Invoice: ${invoice}*`;
  const complaintHeader = `\n\n*Detail Keluhan:*\n`;
  const complaintBody = "[Silahkan ketik Keluhan Disini]";
  const closing = `\n\nMohon untuk segera ditindaklanjuti.\n\nTerima kasih.`;

  return (
    header + intro + invoiceDetail + complaintHeader + complaintBody + closing
  );
};

export const generatePickupNotificationText = (
  customerName: string,
  invoiceId: string
) => {
  const STORE_ADDRESS =
    "Jl. Bunga Coklat No.1, Jatimulyo, Kec. Lowokwaru, Kota Malang, Jawa Timur 65141";
  const PICKUP_HOURS = "Setiap hari: 15:00 - 21:00 WIB";

  const greeting = `Hallo kak *${customerName}*,\n\n`;
  const body = `Kami informasikan bahwa pesanan Anda dengan nomor invoice *${invoiceId}* sudah selesai dan *siap untuk diambil*.`;
  const locationInfo = `\n\nSilakan datang ke lokasi kami di:\n${STORE_ADDRESS}`;
  const hoursInfo = `\n\nJam operasional pengambilan:\n${PICKUP_HOURS}`;
  const closing = `\n\nMohon tunjukkan notifikasi ini saat pengambilan. Terima kasih! 🙏`;

  return greeting + body + locationInfo + hoursInfo + closing;
};

export const generateChatCustomer = (customer: ICustomers) => {
  const header = `Hallo kak *${customer.username} (${customer.customer_id})*\n`;
  const body = `[Isi Pesan]`;

  return header + body;
};
