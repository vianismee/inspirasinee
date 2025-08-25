"use client";

import { useCustomerStore } from "@/stores/customerStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { InfoCustomer } from "./InfoCustomer";
import { Services } from "./Services";
import { useInvoiceID } from "@/hooks/useInvoiceID";
import { Discount } from "./Discount";
import { formatedCurrency } from "@/lib/utils";
import { useCartStore } from "@/stores/cartStore";
import { Button } from "../ui/button";

export function CartApp() {
  const invoiceId = useInvoiceID();
  const activeCustomer = useCustomerStore((state) => state.activeCustomer);
  const { totalPrice } = useCartStore();

  const router = useRouter();
  useEffect(() => {
    if (!activeCustomer) {
      router.replace("/admin/input/");
    }
  }, [activeCustomer, router]);
  return (
    // PERUBAHAN 1: Hapus `relative` karena tidak lagi dibutuhkan
    <section className="w-full h-screen flex flex-col bg-zinc-200">
      <div className="flex flex-shrink-0 px-5 py-3 bg-white">
        <h1 className="font-bold text-2xl text-blue-700">INSPIRASINEE</h1>
      </div>
      <div className="w-full flex-1 overflow-y-auto flex flex-col gap-4 px-6 py-5">
        <Card>
          <CardContent>
            <div className="font-bold text-xl">INVOICE ID {invoiceId}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="text-sm">
            <InfoCustomer label="Customer" value={activeCustomer?.customer} />
            <InfoCustomer label="WhatsApp" value={activeCustomer?.whatsapp} />
            {activeCustomer?.alamat && (
              <InfoCustomer
                label="Pickup / Shiping"
                value={activeCustomer?.alamat}
              />
            )}
          </CardContent>
        </Card>
        <Services />
        <Discount />
      </div>
      <div className="flex flex-shrink-0 justify-between items-center px-5 py-5 bg-white">
        <h1 className="font-medium text-xl">TOTAL</h1>
        <h1 className="font-bold text-xl">{formatedCurrency(totalPrice)}</h1>
        <Button>Payment</Button>
      </div>
    </section>
  );
}
