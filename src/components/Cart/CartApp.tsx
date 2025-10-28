"use client";

import { useCustomerStore } from "@/stores/customerStore";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { InfoCustomer } from "./InfoCustomer";
import { Services } from "./Services";
import { useInvoiceID } from "@/hooks/useNanoID";
import { Discount } from "./Discount";
import { Referral } from "./Referral";
import { PointsRedemption } from "./PointsRedemption";
import { formatedCurrency } from "@/lib/utils";
import { useCartStore } from "@/stores/cartStore";
import { Payment } from "./Payment";
import { Button } from "../ui/button";
import { PointsService } from "@/lib/client-services";

export function CartApp() {
  const invoiceId = useInvoiceID();
  const activeCustomer = useCustomerStore((state) => state.activeCustomer);
  const { clearCustomer } = useCustomerStore();
  const { totalPrice, setInvoice, resetCart } = useCartStore();
  const router = useRouter();
  const [customerPoints, setCustomerPoints] = useState<number>(0);

  // Check if customer is new or existing
  // A customer is considered "new" if they don't have any orders yet
  const isNewCustomer = !activeCustomer?.has_orders || activeCustomer?.total_orders === 0;

  // Check if customer has points available
  const hasPoints = customerPoints > 0;

  // Fetch customer points
  useEffect(() => {
    const fetchPoints = async () => {
      if (activeCustomer) {
        try {
          const points = await PointsService.getCustomerBalance(activeCustomer.customer_id);
          setCustomerPoints(points?.current_balance || 0);
        } catch (error) {
          console.error("Error fetching customer points:", error);
          setCustomerPoints(0);
        }
      }
    };

    fetchPoints();
  }, [activeCustomer]);

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

        {/* Smart rendering logic for referral and points */}
        {/* Always show Referral for new customers */}
        {isNewCustomer && <Referral />}

        {/* Show Points Redemption if customer has points (regardless of new/existing status) */}
        {hasPoints && <PointsRedemption />}

        {/* Show helpful message when both options are available */}
        {isNewCustomer && hasPoints && (
          <div className="text-sm text-muted-foreground text-center py-2 bg-blue-50 rounded-md p-3">
            <p className="font-medium text-blue-800">💡 You have both options available!</p>
            <p className="text-blue-600">Use a referral code for a one-time discount, or redeem your points for savings.</p>
          </div>
        )}
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
