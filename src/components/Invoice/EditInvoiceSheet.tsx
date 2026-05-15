"use client";

import * as React from "react";
import { toast } from "sonner";
import { Trash, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useOrderStore } from "@/stores/orderStore";
import { useServiceCatalogStore, type Discount } from "@/stores/serviceCatalogStore";
import { formatedCurrency } from "@/lib/utils";
import type { OrderWithReferral } from "@/types";

interface EditCartItem {
  id: number;
  shoeName: string;
  services: { name: string; amount: number }[];
}

interface EditInvoiceSheetProps {
  open: boolean;
  order: OrderWithReferral | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditInvoiceSheet({
  open,
  order,
  onClose,
  onSuccess,
}: EditInvoiceSheetProps) {
  const [localCart, setLocalCart] = React.useState<EditCartItem[]>([]);
  const [localDiscounts, setLocalDiscounts] = React.useState<Discount[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);

  const { updateInvoice } = useOrderStore();
  const { discountOptions, allServicesCatalog, fetchCatalog, fetchAllCatalog } =
    useServiceCatalogStore();

  // Load catalog data when sheet opens
  React.useEffect(() => {
    if (open) {
      fetchAllCatalog();
      if (discountOptions.length === 0) fetchCatalog();
    }
  }, [open, fetchAllCatalog, fetchCatalog, discountOptions.length]);

  // Seed local state from order when sheet opens
  React.useEffect(() => {
    if (!open || !order) return;

    const cartItems: EditCartItem[] =
      order.order_item.length > 0
        ? order.order_item.map((item, idx) => ({
            id: Date.now() + idx,
            shoeName: item.shoe_name,
            services: item.services.map((s) => ({
              name: s.service,
              amount: parseFloat(s.amount),
            })),
          }))
        : [{ id: Date.now(), shoeName: "", services: [] }];

    setLocalCart(cartItems);

    // Reconstruct Discount objects from saved order_discounts
    const activeDiscs = (order.order_discounts || []).reduce<Discount[]>(
      (acc, od) => {
        const found = discountOptions.find((d) => d.label === od.discount_code);
        if (found && !acc.some((a) => a.id === found.id)) acc.push(found);
        return acc;
      },
      []
    );
    setLocalDiscounts(activeDiscs);
  }, [open, order]); // eslint-disable-line react-hooks/exhaustive-deps

  const groupedServices = React.useMemo(
    () =>
      allServicesCatalog.reduce(
        (acc, service) => {
          const cat = service.service_category?.name || "Lainnya";
          if (!acc[cat]) acc[cat] = [];
          acc[cat].push(service);
          return acc;
        },
        {} as Record<string, typeof allServicesCatalog>
      ),
    [allServicesCatalog]
  );

  const getAvailableServices = (item: EditCartItem) =>
    Object.entries(groupedServices).map(([cat, services]) => ({
      category: cat,
      services: services.filter((s) => !item.services.some((is) => is.name === s.name)),
    })).filter((g) => g.services.length > 0);

  // ── Totals ──────────────────────────────────────────────────
  const subTotal = React.useMemo(
    () =>
      localCart.reduce(
        (total, item) =>
          total + item.services.reduce((sum, s) => sum + s.amount, 0),
        0
      ),
    [localCart]
  );

  const discountTotal = React.useMemo(
    () =>
      localDiscounts.reduce((total, d) => {
        if (d.percent) return total + Math.round(subTotal * d.percent);
        return total + (d.amount || 0);
      }, 0),
    [localDiscounts, subTotal]
  );

  const referralDiscount = order?.referral_discount_amount ?? 0;
  const pointsDiscount = order?.points_discount_amount ?? 0;
  const membershipDiscount = order?.membership_discount_amount ?? 0;
  const shinePointsDiscount = order?.shine_points_discount_amount ?? 0;
  const totalPrice = Math.max(
    0,
    subTotal - discountTotal - referralDiscount - pointsDiscount - membershipDiscount - shinePointsDiscount
  );

  // ── Cart actions ────────────────────────────────────────────
  const addItem = () =>
    setLocalCart((prev) => [
      ...prev,
      { id: Date.now(), shoeName: "", services: [] },
    ]);

  const removeItem = (id: number) =>
    setLocalCart((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((item) => item.id !== id);
    });

  const updateShoeName = (id: number, value: string) =>
    setLocalCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, shoeName: value } : item))
    );

  const addService = (itemId: number, serviceName: string) => {
    const service = allServicesCatalog.find((s) => s.name === serviceName);
    if (!service) return;
    setLocalCart((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        if (item.services.some((s) => s.name === serviceName)) {
          toast.warning(`Layanan "${serviceName}" sudah ada di item ini.`);
          return item;
        }
        return {
          ...item,
          services: [...item.services, { name: service.name, amount: service.amount }],
        };
      })
    );
  };

  const removeService = (itemId: number, serviceName: string) =>
    setLocalCart((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, services: item.services.filter((s) => s.name !== serviceName) }
          : item
      )
    );

  // ── Discount actions ─────────────────────────────────────────
  const addDiscount = (label: string) => {
    const discount = discountOptions.find((d) => d.label === label);
    if (!discount) return;
    setLocalDiscounts((prev) => [...prev, discount]);
  };

  const removeDiscount = (discountId: number) =>
    setLocalDiscounts((prev) => prev.filter((d) => d.id !== discountId));

  const availableDiscounts = discountOptions.filter(
    (d) => !localDiscounts.some((a) => a.id === d.id)
  );

  // ── Save ────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!order) return;

    if (localCart.some((item) => !item.shoeName || item.services.length === 0)) {
      toast.error(
        "Harap lengkapi semua item (nama sepatu dan minimal 1 layanan)."
      );
      return;
    }

    setIsSaving(true);

    const flatItems = localCart.flatMap((item) =>
      item.services.map((service) => ({
        invoice_id: order.invoice_id,
        shoe_name: item.shoeName,
        service: service.name,
        amount: service.amount,
      }))
    );

    const flatDiscounts = localDiscounts.map((d) => ({
      order_invoice_id: order.invoice_id,
      discount_code: d.label,
      discounted_amount: d.percent
        ? Math.round(subTotal * d.percent)
        : d.amount || 0,
    }));

    const success = await updateInvoice(order.invoice_id, {
      items: flatItems,
      discounts: flatDiscounts,
      subTotal,
      totalPrice,
    });

    setIsSaving(false);
    if (success) {
      onSuccess();
      onClose();
    }
  };

  if (!order) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <SheetTitle className="text-lg font-bold">
            Edit Invoice — {order.invoice_id}
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            {order.customers?.username} · {order.customers?.whatsapp}
          </p>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0 px-6">
          <div className="py-5 space-y-6">
            {/* ── Items ─────────────────────────────────────── */}
            <section className="space-y-4">
              <h3 className="font-semibold text-sm">Item Sepatu</h3>

              {localCart.map((item) => {
                const itemTotal = item.services.reduce(
                  (sum, s) => sum + s.amount,
                  0
                );
                return (
                  <div
                    key={item.id}
                    className="border rounded-md p-4 space-y-4"
                  >
                    <div className="flex items-end gap-3">
                      <div className="flex-1 space-y-1.5">
                        <Label htmlFor={`shoe-${item.id}`}>Nama Sepatu</Label>
                        <Input
                          id={`shoe-${item.id}`}
                          value={item.shoeName}
                          onChange={(e) =>
                            updateShoeName(item.id, e.target.value)
                          }
                          placeholder="e.g. Nike Air Jordan"
                          className="border-zinc-300"
                        />
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground mb-1">
                          Harga
                        </p>
                        <p className="font-semibold">
                          {formatedCurrency(itemTotal)}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                        disabled={localCart.length <= 1}
                        className="shrink-0"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label>Layanan</Label>
                      <div className="flex flex-wrap gap-2">
                        {item.services.length === 0 ? (
                          <p className="text-xs text-muted-foreground">
                            Belum ada layanan.
                          </p>
                        ) : (
                          item.services.map((s) => (
                            <Badge
                              key={s.name}
                              variant="secondary"
                              className="py-1 px-2 text-sm"
                            >
                              {s.name}
                              <button
                                onClick={() => removeService(item.id, s.name)}
                                className="ml-2 rounded-full hover:bg-zinc-300 p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))
                        )}
                      </div>

                      <Select
                        onValueChange={(val) => addService(item.id, val)}
                        value=""
                      >
                        <SelectTrigger className="w-full border-zinc-400">
                          <SelectValue placeholder="+ Tambah layanan" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableServices(item).length === 0 ? (
                            <SelectItem value="__none__" disabled>
                              Semua layanan sudah ditambahkan.
                            </SelectItem>
                          ) : (
                            getAvailableServices(item).map(({ category, services }) => (
                              <SelectGroup key={category}>
                                <SelectLabel>{category}</SelectLabel>
                                {services.map((svc) => (
                                  <SelectItem key={svc.id} value={svc.name}>
                                    <span className="flex items-center justify-between w-full gap-4">
                                      <span>{svc.name}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {formatedCurrency(svc.amount)}
                                      </span>
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })}

              <Button variant="outline" onClick={addItem} className="w-full">
                + Tambah Item
              </Button>
            </section>

            <Separator />

            {/* ── Discounts ─────────────────────────────────── */}
            <section className="space-y-3">
              <h3 className="font-semibold text-sm">Diskon</h3>

              <Select
                onValueChange={addDiscount}
                value=""
                disabled={availableDiscounts.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      availableDiscounts.length === 0
                        ? "Tidak Ada Diskon Lagi"
                        : "Pilih diskon..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableDiscounts.map((d) => (
                    <SelectItem key={d.id} value={d.label}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {localDiscounts.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 p-3"
                >
                  <div>
                    <p className="font-semibold text-green-800 text-sm">
                      {d.label}
                    </p>
                    <p className="text-xs text-green-600">
                      {d.percent
                        ? `${d.percent * 100}%`
                        : `- ${formatedCurrency(d.amount || 0)}`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => removeDiscount(d.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </section>

            <Separator />

            {/* ── Price Summary ──────────────────────────────── */}
            <section className="space-y-2 text-sm">
              <h3 className="font-semibold">Ringkasan Harga</h3>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatedCurrency(subTotal)}</span>
              </div>

              {localDiscounts.map((d) => {
                const applied = d.percent
                  ? Math.round(subTotal * d.percent)
                  : d.amount || 0;
                return (
                  <div key={d.id} className="flex justify-between">
                    <span className="text-muted-foreground">
                      Diskon — {d.label}
                    </span>
                    <span className="text-green-600">
                      -{formatedCurrency(applied)}
                    </span>
                  </div>
                );
              })}

              {referralDiscount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    💰 Referral ({order.referral_code})
                    <span className="ml-1 text-xs text-amber-600">[tetap]</span>
                  </span>
                  <span className="text-green-600">
                    -{formatedCurrency(referralDiscount)}
                  </span>
                </div>
              )}

              {pointsDiscount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    🎯 Poin ({order.points_used} poin)
                    <span className="ml-1 text-xs text-amber-600">[tetap]</span>
                  </span>
                  <span className="text-green-600">
                    -{formatedCurrency(pointsDiscount)}
                  </span>
                </div>
              )}

              {membershipDiscount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    👑 Potongan Membership
                    <span className="ml-1 text-xs text-amber-600">[tetap]</span>
                  </span>
                  <span className="text-green-600">
                    -{formatedCurrency(membershipDiscount)}
                  </span>
                </div>
              )}

              {shinePointsDiscount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    ✨ Potongan Poin Shine
                    <span className="ml-1 text-xs text-amber-600">[tetap]</span>
                  </span>
                  <span className="text-green-600">
                    -{formatedCurrency(shinePointsDiscount)}
                  </span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span>{formatedCurrency(totalPrice)}</span>
              </div>
            </section>
          </div>
        </ScrollArea>

        <SheetFooter className="px-6 py-4 border-t gap-2 flex-row shrink-0">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Batal
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="flex-1">
            {isSaving ? "Menyimpan..." : "Simpan"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
