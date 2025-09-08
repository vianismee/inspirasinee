"use client";

import { useCartStore } from "@/stores/cartStore";
import { useServiceCatalogStore } from "@/stores/serviceCatalogStore";
import { formatedCurrency } from "@/lib/utils";
import { ChevronDown, RotateCcw, Trash } from "lucide-react";
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
// Impor semua komponen Combobox
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

export function Services() {
  const { cart, addItem, removeItem, updateItem, subTotal, resetCart } =
    useCartStore();
  const { serviceCatalog } = useServiceCatalogStore();

  // Kelompokkan layanan berdasarkan kategori
  const groupedServices = React.useMemo(() => {
    return serviceCatalog.reduce((acc, service) => {
      const categoryName = service.service_category?.name || "Lainnya";
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(service);
      return acc;
    }, {} as Record<string, typeof serviceCatalog>);
  }, [serviceCatalog]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Detail</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {cart.map((item) => (
          <div
            key={item.id}
            className="p-4 border rounded-md grid grid-cols-1 md:grid-cols-3 gap-4 relative"
          >
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

            <div className="space-y-2 md:col-span-1">
              <Label htmlFor={`service-${item.id}`}>Jenis Layanan</Label>
              <Combobox
                value={item.serviceName}
                onValueChange={(service) => {
                  updateItem(item.id, "serviceName", service);
                }}
              >
                <ComboboxAnchor>
                  {/* UBAH: Input dibuat readOnly agar tidak bisa diketik */}
                  <ComboboxTrigger>
                    <ComboboxInput
                      id={`service-${item.id}`}
                      placeholder="Pilih layanan..."
                      className="w-full border-zinc-400 cursor-default"
                      readOnly
                      value={item.serviceName}
                    />
                    <ChevronDown className="h-4 w-4" />
                  </ComboboxTrigger>
                </ComboboxAnchor>

                <ComboboxContent>
                  <ComboboxEmpty>Layanan tidak ditemukan.</ComboboxEmpty>
                  {Object.entries(groupedServices).map(
                    ([category, services], index) => (
                      <React.Fragment key={category}>
                        <ComboboxGroup>
                          <ComboboxGroupLabel>{category}</ComboboxGroupLabel>
                          {services.map((service) => (
                            <ComboboxItem key={service.id} value={service.name}>
                              {service.name}
                            </ComboboxItem>
                          ))}
                        </ComboboxGroup>
                        {index < Object.entries(groupedServices).length - 1 && (
                          <Separator className="my-1" />
                        )}
                      </React.Fragment>
                    )
                  )}
                </ComboboxContent>
              </Combobox>
            </div>

            <div className="flex items-end justify-between md:col-span-1">
              <div className="space-y-2">
                <Label>Harga</Label>
                <p className="font-semibold text-lg">
                  {formatedCurrency(item.amount)}
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
          </div>
        ))}

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
