// src/components/Cart/CartApp.tsx

"use client";

import { useCustomerStore } from "@/stores/customerStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { InfoCustomer } from "./InfoCustomer";
import { Services } from "./Services";
import { useInvoiceID } from "@/hooks/useNanoID";
import { Discount } from "./Discount";
import { formatedCurrency } from "@/lib/utils";
import { useCartStore } from "@/stores/cartStore";
import { Payment } from "./Payment";
import { useServiceCatalogStore } from "@/stores/serviceCatalogStore";
import { Button } from "../ui/button";

export function CartApp() {
  const invoiceId = useInvoiceID();
  const activeCustomer = useCustomerStore((state) => state.activeCustomer);
  const { clearCustomer } = useCustomerStore();
  const { totalPrice, setInvoice, resetCart } = useCartStore();
  const router = useRouter();
  const fetchCatalog = useServiceCatalogStore((state) => state.fetchCatalog);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  useEffect(() => {
    if (!activeCustomer) {
      router.replace("/admin/order/");
    }
  }, [activeCustomer, router]);

  useEffect(() => {
    setInvoice(invoiceId);
  }, [invoiceId, setInvoice]);

  const handleBatal = () => {
    resetCart();
    clearCustomer();
  };

  return (
    <section className="w-full flex flex-col bg-zinc-200 h-full">
      <div className="flex-1 overflow-y-auto flex flex-col py-5 gap-4 px-6 mb-20">
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
            <InfoCustomer
              label="ID Customer"
              value={activeCustomer?.customer_id}
            />
            <InfoCustomer label="Customer" value={activeCustomer?.username} />
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
      <div className="fixed md:sticky w-full bottom-0 flex-shrink-0 flex justify-between items-center px-5 py-3 bg-white border-t">
        <Button variant={"outline"} onClick={handleBatal}>
          Batal
        </Button>
        <h1 className="font-medium text-xl">TOTAL</h1>
        <h1 className="font-bold text-xl">{formatedCurrency(totalPrice)}</h1>

        <Payment />
      </div>
    </section>
  );
}
