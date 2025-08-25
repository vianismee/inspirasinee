// hooks/useInvoiceID.ts

"use client"; // 👈 Wajib ditambahkan untuk client component hook

import { useState } from "react";
import { customAlphabet } from "nanoid";

export function useInvoiceID() {
  // Gunakan useState dengan lazy initial state untuk memastikan
  // ID hanya di-generate satu kali saat komponen pertama kali mount.
  const [invoiceId] = useState(() => {
    // 1. Ambil alphabet dari environment variable yang sudah di-expose ke client
    const alphabet = process.env.NEXT_PUBLIC_NANO_ID;

    // Beri nilai default jika variabel tidak ditemukan
    if (!alphabet) {
      console.error("NANO_ID alphabet is not defined in .env.local");
      return "ERROR_ID"; // Atau alphabet default
    }

    // 2. Buat fungsi generator nanoid
    const generate = customAlphabet(alphabet, 8); // misal, panjang 8 karakter

    // 3. Panggil fungsi untuk mendapatkan ID
    return generate();
  });

  return invoiceId; // Kembalikan ID sebagai string, lebih praktis
}
