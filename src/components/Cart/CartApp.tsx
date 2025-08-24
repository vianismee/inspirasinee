"use client";

import { useCustomerStore } from "@/stores/customerStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { InfoCustomer } from "./InfoCustomer";
import { Services } from "./Services";

interface CartAppProps {
  invoiceId: string;
}

export function CartApp({ invoiceId }: CartAppProps) {
  const activeCustomer = useCustomerStore((state) => state.activeCustomer);

  const router = useRouter();
  useEffect(() => {
    if (!activeCustomer) {
      router.replace("/admin/input/");
    }
  }, [activeCustomer, router]);
  return (
    <section className="w-full h-screen flex flex-col">
      <div className="w-full h-[20%] flex flex-col gap-4 px-6 py-5">
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
    </section>
  );
}
