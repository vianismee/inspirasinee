"use client";

import { useCustomerStore } from "@/stores/customerStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { InfoCustomer } from "./InfoCustomer";
import { Services } from "./Services";
import { useInvoiceID } from "@/hooks/useInvoiceID";
import { useCartStore } from "@/stores/cartStore";
import { formatedCurrency } from "@/lib/utils";

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
    <section className="w-full h-screen flex flex-col">
      <div className="w-full flex-1 overflow-y-auto flex flex-col gap-4 px-6 py-5">
        <h1 className="font-bold text-2xl text-blue-700">INSPIRASINEE</h1>
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
      </div>
      <div className="w-full flex-shrink-0 font-bold text-2xl flex justify-between items-center px-7 py-4 bg-white border-t">
        <h1>TOTAL</h1>
        <h1>{formatedCurrency(totalPrice)}</h1>
      </div>
    </section>
  );
}
