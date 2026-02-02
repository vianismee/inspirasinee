"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import TimelineProgress from "../time-line-progress";
import { formatedCurrency, formatPhoneNumber } from "@/lib/utils";
import { Logo } from "../Logo";
import { MapPin, Phone, User, UserCircle } from "lucide-react";
import { Badge } from "../ui/badge";
import { Orders } from "@/types/index";
import { createCustomerDashboardLink } from "@/lib/customer-dashboard-hash";
import { ContactCs, generateComplaintText } from "@/lib/invoiceUtils";
import { AdsBanner } from "./AdsBanner";
import { PointsCard } from "./PointsCard";
import { ReferralCard } from "./ReferralCard";
import { InvoiceItems } from "./InvoiceItems";
import { PointsData, ReferralData, AdConfig } from "@/types/tracking";

// Extended interface for orders with referral properties
interface OrderWithReferral extends Orders {
  referral_code?: string;
  referral_discount_amount?: number;
  points_used?: number;
  points_discount_amount?: number;
}

const WHATSAPP_NUMBER = "+6289525444734";

interface TrackingDesktopProps {
  order: Orders;
  pointsData?: PointsData;
  referralData?: ReferralData | null;
  ads?: AdConfig[];
}

export function TrackingDesktop({
  order,
  pointsData,
  referralData,
  ads = [],
}: TrackingDesktopProps) {
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

  // Default points data if not provided
  const defaultPointsData: PointsData = pointsData || {
    current_balance: 0,
    total_earned: 0,
    total_redeemed: 0,
  };

  return (
    <main
      className="min-h-screen w-full p-4 sm:p-6 md:p-8"
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(229,231,235,0.8) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(229,231,235,0.8) 1px, transparent 1px),
          radial-gradient(circle 500px at 20% 80%, rgba(139,92,246,0.3), transparent),
          radial-gradient(circle 500px at 80% 20%, rgba(59,130,246,0.3), transparent)
        `,
        backgroundSize: "48px 48px, 48px 48px, 100% 100%, 100% 100%",
        backgroundAttachment: "scroll",
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col items-center gap-4 mb-10">
          <Logo size={12} className="scale-120" />
        </header>

        {/* Ads Banner */}
        <AdsBanner ads={ads} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Order Details (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Order Status Card */}
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold tracking-wider">
                      {order?.invoice_id}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground pt-1">
                      {new Date(order.created_at).toLocaleDateString("id-ID", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <TimelineProgress progress={order?.status || ""} />
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Customer Details */}
                  <div>
                    <h3 className="font-semibold mb-3">Detail Pelanggan</h3>
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
                          <span>{customer.alamat}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Payment Method */}
                  <div>
                    <h3 className="font-semibold mb-3">Metode Pembayaran</h3>
                    <Badge
                      variant={order.payment === "Pending" ? "destructive" : "default"}
                      className={order.payment !== "Pending" ? "bg-green-100 text-green-800" : ""}
                    >
                      {order.payment}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Invoice Items Card */}
            <InvoiceItems order={order} />
          </div>

          {/* Right Column: Points, Referral & Actions (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
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
                <Button size="lg" className="w-full py-6 text-base font-bold">
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
                    className="w-full py-6 text-base font-bold"
                  >
                    Complain
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
