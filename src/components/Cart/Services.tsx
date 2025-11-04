"use client";

import { useCartStore } from "@/stores/cartStore"; // UBAH: Impor tipe ServiceItem
import { useServiceCatalogStore } from "@/stores/serviceCatalogStore";
import { formatedCurrency } from "@/lib/utils";
import { ChevronDown, RotateCcw, Trash, X } from "lucide-react"; // BARU: Impor ikon X
import * as React from "react";

// Impor Komponen UI
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import {
  Combobox,
  ComboboxAnchor,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxInput,
  ComboboxItem,
  ComboboxTrigger,
} from "@/components/ui/combobox";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge"; // BARU: Impor Badge

// Helper function to format price in the requested format
const formatPrice = (amount: number) => {
  return `Rp. ${amount.toLocaleString("id-ID")}`;
};

export function Services() {
  // UBAH: Ambil aksi baru, hapus 'updateItem' karena sudah dipecah
  const {
    cart,
    addItem,
    removeItem,
    updateItem, // Masih dipakai untuk shoeName
    addServiceToItem, // BARU
    removeServiceFromItem, // BARU
    subTotal,
    resetCart,
  } = useCartStore();
  const { allServicesCatalog } = useServiceCatalogStore();

  const groupedServices = React.useMemo(() => {
    // ... logika ini tidak berubah
    return allServicesCatalog.reduce((acc, service) => {
      const categoryName = service.service_category?.name || "Lainnya";
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(service);
      return acc;
    }, {} as Record<string, typeof allServicesCatalog>);
  }, [allServicesCatalog]);

  const handleServiceSelect = (itemId: number, serviceName: string) => {
    const service = allServicesCatalog.find((s) => s.name === serviceName);
    if (service) {
      addServiceToItem(itemId, { name: service.name, amount: service.amount });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Detail</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {cart.map((item) => {
          // BARU: Hitung total per item di sini
          const itemTotal = item.services.reduce(
            (sum, service) => sum + service.amount,
            0
          );

          return (
            <div
              key={item.id}
              className="p-4 border rounded-md grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6 relative"
            >
              {/* === Kolom Nama Sepatu (Tidak banyak berubah) === */}
              <div className="space-y-2 md:col-span-1">
                <Label htmlFor={`shoeName-${item.id}`}>Nama Sepatu</Label>
                <Input
                  id={`shoeName-${item.id}`}
                  value={item.shoeName}
                  onChange={(e) =>
                    updateItem(item.id, "shoeName", e.target.value)
                  }
                  className="border-zinc-300"
                  placeholder="e.g., Nike Air Jordan"
                />
              </div>

              {/* === Kolom Harga & Tombol Hapus (Layout disesuaikan) === */}
              <div className="flex items-end justify-between md:col-span-1">
                <div className="space-y-2">
                  <Label>Harga</Label>
                  <p className="font-semibold text-lg">
                    {formatedCurrency(itemTotal)}{" "}
                    {/* UBAH: Gunakan itemTotal */}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => removeItem(item.id)}
                  disabled={cart.length <= 1}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>

              {/* === Bagian Layanan (Dirombak Total) === */}
              <div className="space-y-4 md:col-span-2">
                <Label>Layanan Tambahan</Label>
                {/* BARU: Area untuk menampilkan layanan yang dipilih sebagai Badge */}
                <div className="flex flex-wrap gap-2">
                  {item.services.length > 0 ? (
                    item.services.map((service) => (
                      <Badge
                        key={service.name}
                        variant="secondary"
                        className="py-1 px-2 text-sm"
                      >
                        {service.name}
                        <button
                          onClick={() =>
                            removeServiceFromItem(item.id, service.name)
                          }
                          className="ml-2 rounded-full hover:bg-zinc-300 dark:hover:bg-zinc-600 p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))
                  ) : (
                    <p className="text-xs text-zinc-500">
                      Belum ada layanan yang ditambahkan.
                    </p>
                  )}
                </div>
                <Combobox
                  onValueChange={(val) => handleServiceSelect(item.id, val)}
                  value=""
                >
                  <ComboboxAnchor>
                    <ComboboxTrigger>
                      <ComboboxInput
                        placeholder="+ Tambah layanan"
                        className="w-full border-zinc-400"
                        readOnly
                      />
                      <ChevronDown className="h-4 w-4" />
                    </ComboboxTrigger>
                  </ComboboxAnchor>
                  <ComboboxContent>
                    <ComboboxEmpty>Layanan tidak ditemukan.</ComboboxEmpty>
                    <ScrollArea className="h-[250px]">
                      {Object.entries(groupedServices).map(
                        ([category, services], index) => (
                          <React.Fragment key={category}>
                            <ComboboxGroup>
                              <ComboboxGroupLabel>
                                {category}
                              </ComboboxGroupLabel>
                              {services.map((service) => (
                                <ComboboxItem
                                  key={service.id}
                                  value={service.name}
                                >
                                  <div className="flex items-center gap-1 justify-between w-full">
                                    <span>{service.name}</span>
                                    <div className="flex items-center gap-1">
                                      <span className="text-gray-500"> -</span>
                                      <span className="text-sm text-gray-500 font-medium">
                                        {formatPrice(service.amount)}
                                      </span>
                                    </div>
                                  </div>
                                </ComboboxItem>
                              ))}
                            </ComboboxGroup>
                            {index <
                              Object.entries(groupedServices).length - 1 && (
                              <Separator className="my-1" />
                            )}
                          </React.Fragment>
                        )
                      )}
                    </ScrollArea>
                  </ComboboxContent>
                </Combobox>
              </div>
            </div>
          );
        })}

        <Button variant="default" onClick={addItem} className="w-full">
          + Tambah Item
        </Button>
        <Button
          className="w-full flex items-center gap-2"
          variant={"outline"}
          onClick={() => resetCart()}
        >
          <RotateCcw className="h-4 w-4" /> Reset Item
        </Button>
      </CardContent>
      <Separator />
      <CardFooter>
        <div className="w-full flex justify-between">
          <h1 className="font-medium text-lg">Subtotal</h1>
          <h1 className="font-bold text-lg">{formatedCurrency(subTotal)}</h1>
        </div>
      </CardFooter>
    </Card>
  );
}
