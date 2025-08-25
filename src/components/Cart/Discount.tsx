// components/Discount.tsx

"use client";

import { useCartStore } from "@/stores/cartStore"; // Sesuaikan dengan path store Anda
import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { formatedCurrency } from "@/lib/utils"; // Sesuaikan path

export function Discount() {
  // 1. Ambil state dan action dari Zustand
  const { activeDiscount, applyDiscount, removeDiscount } = useCartStore();
  const [inputCode, setInputCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleApplyCode = () => {
    applyDiscount(inputCode);
  };

  // 4. Tampilan jika SUDAH ADA diskon yang aktif
  if (activeDiscount) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Discount</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center p-3 bg-green-50 border border-green-200 rounded-md">
            <div>
              <p className="font-semibold text-green-800">
                {activeDiscount.label}
              </p>
              <p className="text-sm text-green-600">
                Potongan {formatedCurrency(activeDiscount.amount)}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={removeDiscount}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Discount</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Input
            className="border-zinc-400"
            placeholder="Kode Diskon"
            value={inputCode}
            onChange={(e) => {
              setInputCode(e.target.value);
              setError(null); // Hapus error saat pengguna mulai mengetik lagi
            }}
          />
          <Button onClick={handleApplyCode}>Terapkan</Button>
        </div>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </CardContent>
    </Card>
  );
}
