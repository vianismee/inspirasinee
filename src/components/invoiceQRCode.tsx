"use client";
import { QRCodeSVG } from "qrcode.react";

interface invoiceQRCodeProps {
  invoiceId: string;
}

export function InvoiceQRCode({ invoiceId }: invoiceQRCodeProps) {
  if (!invoiceId) {
    return null;
  }
  return (
    <>
      <QRCodeSVG value={invoiceId} level={"L"} />
    </>
  );
}
