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

// Extended interface for orders with referral properties
interface OrderWithReferral extends Orders {
  referral_code?: string;
  referral_discount_amount?: number;
  points_used?: number;
  points_discount_amount?: number;
}
import { ContactCs, generateComplaintText } from "@/lib/invoiceUtils";

// --- PERBAIKAN: Gunakan konstanta untuk nomor yang berulang ---
const WHATSAPP_NUMBER = "+6289525444734";

interface TrackingDesktopProps {
  order: Orders;
}

export function TrackingDesktop({ order }: TrackingDesktopProps) {
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

  return (
    <main
      className="absolute inset-0 min-h-screen w-full p-4 sm:p-6 md:p-8"
      style={{
        backgroundImage: `
            linear-gradient(to right, rgba(229,231,235,0.8) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(229,231,235,0.8) 1px, transparent 1px),
            radial-gradient(circle 500px at 20% 80%, rgba(139,92,246,0.3), transparent),
            radial-gradient(circle 500px at 80% 20%, rgba(59,130,246,0.3), transparent)
          `,
        backgroundSize: "48px 48px, 48px 48px, 100% 100%, 100% 100%",
      }}
    >
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col items-center gap-4 mb-10">
          <Logo size={12} className="scale-120" />
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Kolom Kiri: Detail Order */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader>
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
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Detail Pelanggan */}
                  <div>
                    <h3 className="font-semibold mb-3">Detail Pelanggan</h3>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <div className="flex items-center gap-3">
                        <User size={16} />
                        <span>{customer.username}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone size={16} />
                        <span>
                          {formatPhoneNumber(order.customers.whatsapp)}
                        </span>
                      </div>
                      {customer.alamat && (
                        <div className="flex items-start gap-3">
                          <MapPin size={16} className="mt-1 flex-shrink-0" />
                          <span>{customer.alamat}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Metode Pembayaran */}
                  <div>
                    <h3 className="font-semibold mb-3">Metode Pembayaran</h3>
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
                </div>
                <Separator />
                {/* Rincian Order */}
                <div>
                  <h3 className="font-semibold mb-3">Rincian Order</h3>
                  <div className="space-y-4">
                    {order?.order_item.map((groupedItem, index) => (
                      <div key={index} className="flex flex-col text-sm">
                        <span className="font-semibold">
                          {groupedItem.shoe_name}
                        </span>
                        <div className="flex flex-col pl-3 mt-1 space-y-1">
                          {groupedItem.services.map((service, serviceIndex) => (
                            <div
                              key={serviceIndex}
                              className="flex justify-between items-center"
                            >
                              <p className="text-xs text-muted-foreground">
                                - {service.service}
                              </p>
                              <span className="font-mono text-xs">
                                {formatedCurrency(parseFloat(service.amount))}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
              {/* Total Pembayaran */}
              <CardFooter className="bg-zinc-50 flex flex-col gap-2 p-6">
                <div className="w-full space-y-2">
                  <div className="flex justify-between text-sm">
                    <p className="text-muted-foreground font-medium">
                      Subtotal
                    </p>
                    <p className="font-mono font-medium">
                      {formatedCurrency(order?.subtotal || 0)}
                    </p>
                  </div>
                  {order?.order_discounts && order.order_discounts.length > 0 &&
                    order.order_discounts.map((d, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <p className="text-muted-foreground">
                          Diskon - {d.discount_code || 'Unknown'}
                        </p>
                        <p className="font-mono text-green-600">
                          -{formatedCurrency(d.discounted_amount || 0)}
                        </p>
                      </div>
                    ))
                  }

                  {/* Referral Discount Display */}
                  {(order as OrderWithReferral)?.referral_code && ((order as OrderWithReferral)?.referral_discount_amount || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <p className="text-muted-foreground">
                        💰 Referral - {(order as OrderWithReferral).referral_code}
                      </p>
                      <p className="font-mono text-green-600">
                        -{formatedCurrency((order as OrderWithReferral).referral_discount_amount || 0)}
                      </p>
                    </div>
                  )}

                  {/* Points Redemption Display */}
                  {(order as OrderWithReferral)?.points_used && ((order as OrderWithReferral).points_used ?? 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <p className="text-muted-foreground">
                        🎯 Poin ({(order as OrderWithReferral).points_used} poin)
                      </p>
                      <p className="font-mono text-green-600">
                        -{formatedCurrency((order as OrderWithReferral).points_discount_amount || 0)}
                      </p>
                    </div>
                  )}

                  <Separator className="my-2" />
                  <div className="flex justify-between items-center font-bold text-base">
                    <p>Total</p>
                    <p className="font-mono text-lg">
                      {formatedCurrency(order?.total_price || 0)}
                    </p>
                  </div>
                </div>
              </CardFooter>
            </Card>
          </div>

          {/* Kolom Kanan: Status & Aksi */}
          <div className="lg:col-span-1 flex flex-col gap-8">
            <Card className="shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Status Order</CardTitle>
                <p className="text-sm text-muted-foreground pt-1">
                  Lacak Status Order
                </p>
              </CardHeader>
              <CardContent>
                <TimelineProgress progress={order?.status || ""} />
              </CardContent>
            </Card>
            {/* Tombol Aksi */}
            <div className="flex flex-col w-full gap-2">
              <Button
                onClick={handleDashboardAccess}
                size={"lg"}
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
                <Button size={"lg"} className="w-full py-6 text-base font-bold">
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
                    size={"lg"}
                    variant={"outline"}
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
