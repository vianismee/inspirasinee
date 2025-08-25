// Services.tsx
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useCartStore } from "@/stores/cartStore";
import { formatedCurrency } from "@/lib/utils";
import { Trash } from "lucide-react";

// Daftar SERVICE tetap dibutuhkan di komponen untuk mengisi pilihan di Select
const SERVICE = [
  { name: "Express Cleaning (1 Day)", amount: 50000 },
  { name: "Deep Cleaning (3 Day)", amount: 35000 },
  { name: "Whitening Cleaning (4 Day)", amount: 45000 },
  { name: "Kids Shoe Treatment (3 Day)", amount: 30000 },
  { name: "Woman Shoe Treatment (3 Day)", amount: 30000 },
];

export function Services() {
  // Ambil state dan action baru dari store
  const { cart, addItem, removeItem, updateItem } = useCartStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Service</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {cart.map((item) => (
          <div
            key={item.id}
            className="p-4 border rounded-md grid grid-cols-1 md:grid-cols-3 gap-4 relative"
          >
            <div className="space-y-2 md:col-span-1 placeholder:text-muted">
              <Label htmlFor={`shoeName-${item.id}`}>Nama Sepatu</Label>
              <Input
                id={`shoeName-${item.id}`}
                placeholder="Adidas Samba"
                value={item.shoeName}
                onChange={(e) =>
                  updateItem(item.id, "shoeName", e.target.value)
                }
                className="border-zinc-300"
              />
            </div>

            <div className="space-y-2 md:col-span-1">
              <Label htmlFor={`service-${item.id}`}>Jenis Layanan</Label>
              <Select
                value={item.serviceName}
                onValueChange={(service) =>
                  updateItem(item.id, "serviceName", service)
                }
              >
                <SelectTrigger
                  id={`service-${item.id}`}
                  className="w-full border-zinc-300"
                >
                  <SelectValue placeholder="Pilih layanan..." />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE.map((service) => (
                    <SelectItem key={service.name} value={service.name}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                disabled={cart.length <= 1} // Tombol disable jika hanya ada 1 item
              >
                <Trash />
              </Button>
            </div>
          </div>
        ))}

        {/* Tombol untuk menambah baris item baru */}
        <Button variant="outline" onClick={addItem} className="w-full">
          + Tambah Item Lain
        </Button>
      </CardContent>
    </Card>
  );
}
