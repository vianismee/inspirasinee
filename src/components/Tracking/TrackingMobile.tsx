"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import TimelineProgress from "../time-line-progress";
import { formatedCurrency, formatPhoneNumber } from "@/lib/utils";
import { Logo } from "../Logo";
import { MapPin, Phone, User, UserCircle, ArrowLeft } from "lucide-react";
import { Badge } from "../ui/badge";
import { Orders } from "@/types/index";
import { createCustomerDashboardLink } from "@/lib/customer-dashboard-hash";
import { ContactCs, generateComplaintText } from "@/lib/invoiceUtils";
import { AdsBanner } from "./AdsBanner";
import { PointsCard } from "./PointsCard";
import { ReferralCard } from "./ReferralCard";
import { InvoiceItems } from "./InvoiceItems";
import { PointsData, ReferralData, AdConfig } from "@/types/tracking";

const WHATSAPP_NUMBER = "+6289525444734";

interface TrackingMobileProps {
  order: Orders;
  pointsData?: PointsData;
  referralData?: ReferralData | null;
  ads?: AdConfig[];
}

export function TrackingMobile({
  order,
  pointsData,
  referralData,
  ads = [],
}: TrackingMobileProps) {
  const customer = order.customers;

  const { contactAdminUrl, complainChatUrl } = useMemo(() => {
    const contactMessage = ContactCs(order.invoice_id);
    const complaintMessage = generateComplaintText(order.invoice_id);
    const encodedContact = encodeURIComponent(contactMessage);
    const encodedComplain = encodeURIComponent(complaintMessage);

    return {
      contactAdminUrl: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedContact}`,
      complainChatUrl: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedComplain}`,
    };
  }, [order.invoice_id]);

  const handleDashboardAccess = () => {
    if (customer?.whatsapp) {
      const dashboardLink = createCustomerDashboardLink(customer.whatsapp);
      window.location.href = dashboardLink;
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  // Default points data if not provided
  const defaultPointsData: PointsData = pointsData || {
    current_balance: 0,
    total_earned: 0,
    total_redeemed: 0,
  };

  return (
    <main className="min-h-screen w-full bg-white">
      {/* Background gradient pattern */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(229,231,235,0.8) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(229,231,235,0.8) 1px, transparent 1px),
            radial-gradient(circle 500px at 20% 80%, rgba(139,92,246,0.3), transparent),
            radial-gradient(circle 500px at 80% 20%, rgba(59,130,246,0.3), transparent)
          `,
          backgroundSize: "48px 48px, 48px 48px, 100% 100%, 100% 100%",
        }}
      />

      <div className="relative z-10 w-full max-w-md mx-auto">
        {/* Sticky Header */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleBack}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Logo size={10} />
          </div>
        </header>

        {/* Ads Banner */}
        <div className="px-4 pt-4">
          <AdsBanner ads={ads} />
        </div>

        {/* Content */}
        <div className="px-4 py-6 space-y-6">
          {/* Order Status Card */}
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-xl font-bold tracking-wider">
                {order?.invoice_id}
              </CardTitle>
              <p className="text-sm text-muted-foreground pt-1">
                {new Date(order.created_at).toLocaleDateString("id-ID", {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </CardHeader>
            <CardContent>
              <TimelineProgress progress={order?.status || ""} />
              <Separator className="my-4" />

              {/* Customer Details */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Detail Pelanggan</h3>
                <div className="text-sm text-muted-foreground space-y-2">
                  <div className="flex items-center gap-3">
                    <User size={16} />
                    <span>{customer.username}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone size={16} />
                    <span>{formatPhoneNumber(customer.whatsapp)}</span>
                  </div>
                  {customer.alamat && (
                    <div className="flex items-start gap-3">
                      <MapPin size={16} className="mt-1 flex-shrink-0" />
                      <span className="text-xs">{customer.alamat}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator className="my-4" />

              {/* Payment Method */}
              <div>
                <h3 className="font-semibold text-sm mb-2">
                  Metode Pembayaran
                </h3>
                <Badge
                  variant={
                    order.payment === "Pending" ? "destructive" : "default"
                  }
                  className={
                    order.payment !== "Pending"
                      ? "bg-green-100 text-green-800"
                      : ""
                  }
                >
                  {order.payment}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Items Card */}
          <InvoiceItems order={order} />

          {/* Points Balance Card */}
          <PointsCard pointsData={defaultPointsData} />

          {/* Referral Code Card */}
          <ReferralCard referralData={referralData || null} />

          {/* Action Buttons */}
          <div className="flex flex-col w-full gap-2">
            <Button
              onClick={handleDashboardAccess}
              size="lg"
              className="w-full py-6 text-base font-bold bg-green-600 hover:bg-green-700 text-white"
            >
              <UserCircle className="w-5 h-5 mr-2" />
              Dashboard Pelanggan
            </Button>
            <a
              href={contactAdminUrl}
              target="_blank"
              className="w-full"
              rel="noopener noreferrer"
            >
              <Button size="lg" className="w-full py-5 text-base font-semibold">
                Hubungi Kami
              </Button>
            </a>
            {order.status === "finish" && (
              <a
                href={complainChatUrl}
                target="_blank"
                className="w-full"
                rel="noopener noreferrer"
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full py-5 text-base font-semibold"
                >
                  Complain
                </Button>
              </a>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="px-4 py-6 text-center text-xs text-gray-500">
          <p>© 2026 Inspirasinee. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}
