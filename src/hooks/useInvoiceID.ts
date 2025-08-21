import { QRCodeCanvas } from "qrcode.react";

export function useInviceID() {
  const { customAlphabet } = require("nanoid");
  const alphabet = process.env.NANO_ID;
  const invoiceId = customAlphabet(alphabet, 6);

  return { invoiceId: invoiceId() };
}
