// hooks/useInvoiceID.ts

"use client"; // 👈 Wajib ditambahkan untuk client component hook

import { useState } from "react";
import { customAlphabet } from "nanoid";

export function useInvoiceID() {
  const [invoiceId] = useState(() => {
    const alphabet = process.env.NEXT_PUBLIC_NANO_ID;
    if (!alphabet) {
      console.error("NANO_ID alphabet is not defined in .env.local");
      return "ERROR_ID"; // Atau alphabet default
    }
    const generate = customAlphabet(alphabet, 6);
    return generate();
  });

  return invoiceId;
}
