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
import { ShinePointsRedemption } from "./ShinePointsRedemption";
import { formatedCurrency } from "@/lib/utils";
import { useCartStore } from "@/stores/cartStore";
import { Payment } from "./Payment";
import { Button } from "../ui/button";
import { PointsService } from "@/lib/client-services";
import { logger } from "@/utils/client/logger";
import { MembershipDisplay } from "./MembershipDisplay";
import { Badge } from "../ui/badge";
import { MEMBERSHIP_LEVEL_COLORS } from "@/types/membership";

export function CartApp() {
  const invoiceId = useInvoiceID();
  const activeCustomer = useCustomerStore((state) => state.activeCustomer);
  const { clearCustomer } = useCustomerStore();
  const { totalPrice, setInvoice, resetCart, membershipLevel, membershipDiscount, fetchAndApplyMembershipDiscount, recalculateMembershipDiscount, cart } = useCartStore();
  const router = useRouter();
  const [customerPoints, setCustomerPoints] = useState<number>(0);

  // Check if customer is new or existing
  // A customer is considered "new" if they don't have any orders yet
  const isNewCustomer = !activeCustomer?.has_orders || activeCustomer?.total_orders === 0;

  // Fetch customer points
  useEffect(() => {
    const fetchPoints = async () => {
      if (activeCustomer) {
        try {
          const points = await PointsService.getCustomerBalance(activeCustomer.customer_id);
          setCustomerPoints(points?.current_balance || 0);
        } catch (error) {
          logger.error("Error fetching customer points", { error, customerId: activeCustomer.customer_id }, "CartApp");
          setCustomerPoints(0);
        }
      }
    };

    fetchPoints();
  }, [activeCustomer]);

  // Fetch and apply membership discount for existing customers
  useEffect(() => {
    const applyMembershipDiscount = async () => {
      if (activeCustomer && !activeCustomer.isNew) {
        try {
          await fetchAndApplyMembershipDiscount(activeCustomer.customer_id);
          logger.info("Membership discount fetched for customer", { customerId: activeCustomer.customer_id }, "CartApp");
        } catch (error) {
          logger.error("Error fetching membership discount", { error, customerId: activeCustomer.customer_id }, "CartApp");
          // Don't block the flow if membership discount fails
        }
      }
    };

    applyMembershipDiscount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCustomer?.customer_id]); // Only re-run when customer changes

  // Recalculate membership discount when cart items change
  useEffect(() => {
    const recalculateDiscount = async () => {
      if (activeCustomer && !activeCustomer.isNew && membershipLevel) {
        try {
          await recalculateMembershipDiscount();
        } catch (error) {
          logger.error("Error recalculating membership discount", { error }, "CartApp");
        }
      }
    };

    recalculateDiscount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart]); // Only re-run when cart changes

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
            <div className="flex justify-between items-center">
              <p className="text-muted-foreground">Customer</p>
              <div className="flex items-center gap-2">
                <p className="font-bold text-right">{activeCustomer?.username}</p>
                {membershipLevel && (
                  <Badge className={`${MEMBERSHIP_LEVEL_COLORS[membershipLevel as keyof typeof MEMBERSHIP_LEVEL_COLORS]?.bg || "bg-gray-100"} ${MEMBERSHIP_LEVEL_COLORS[membershipLevel as keyof typeof MEMBERSHIP_LEVEL_COLORS]?.primary || "text-gray-600"} border-0 text-xs`}>
                    {membershipLevel}
                  </Badge>
                )}
              </div>
            </div>
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
        <MembershipDisplay />
        <Discount />

        {/* Simple conditional redemption logic */}
        {isNewCustomer ? (
          <Referral />
        ) : (
          <>
            <PointsRedemption />
            <ShinePointsRedemption />
          </>
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
