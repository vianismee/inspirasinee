// components/Discount.tsx

"use client";

import { useCartStore } from "@/stores/cartStore";
import { useServiceCatalogStore } from "@/stores/serviceCatalogStore";
import { formatedCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
// <<< BARU: Impor komponen yang dibutuhkan untuk Select
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function Discount() {
  const { activeDiscounts, addDiscount, removeDiscount } = useCartStore();
  const { discountOptions } = useServiceCatalogStore();

  // <<< BARU: Logika untuk menangani pemilihan dari dropdown
  const handleSelectDiscount = (selectedValue: string) => {
    // Cari objek diskon lengkap berdasarkan nama yang dipilih
    const selectedDiscount = discountOptions.find(
      (option) => option.label === selectedValue
    );
    if (selectedDiscount) {
      addDiscount(selectedDiscount);
    }
  };

  // <<< BARU: Filter pilihan diskon agar tidak menampilkan yang sudah aktif
  const availableOptions = discountOptions.filter(
    (option) => !activeDiscounts.some((d) => d.label === option.label)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Diskon</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="mb-2 text-sm font-medium">Pilih Diskon</h4>
          <Select
            onValueChange={handleSelectDiscount}
            disabled={availableOptions.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih diskon yang tersedia..." />
            </SelectTrigger>
            <SelectContent>
              {availableOptions.map((option) => (
                <SelectItem key={option.id} value={option.label}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {activeDiscounts.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-medium">Diskon Aktif</h4>
            <div className="space-y-2">
              {activeDiscounts.map((discount) => (
                <div
                  key={discount.id}
                  className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 p-3"
                >
                  <div>
                    <p className="font-semibold text-green-800">
                      {discount.label}
                    </p>
                    <p className="text-sm text-green-600">
                      {discount.percent
                        ? `Potongan ${discount.percent * 100}%`
                        : `Potongan ${formatedCurrency(discount.amount || 0)}`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removeDiscount(discount.label)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
