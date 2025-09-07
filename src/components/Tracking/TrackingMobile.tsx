"use client";
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
import { MapPin, Phone, User } from "lucide-react";
import { Badge } from "../ui/badge";
import { Orders } from "@/types/index"; // Ganti dengan tipe data order Anda

// Terima 'order' sebagai prop
interface TrackingMobileProps {
  order: Orders;
}

export function TrackingMobile({ order }: TrackingMobileProps) {
  return (
    <main className="w-full bg-white max-w-2xl mx-auto">
      <section className="h-screen sticky top-0 z-0">
        <div className="relative translate-y-[30px] z-10 w-full flex flex-col gap-10 items-center justify-center">
          <Logo size={15} />
        </div>
        <div
          className="absolute inset-0"
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
      </section>
      <section className="min-h-screen relative z-10 bg-zinc-200 rounded-t-3xl gap-7 -mt-[calc(100vh-250px)] flex flex-col items-center overflow-hidden pb-10">
        <div className="w-full flex flex-col items-center py-7 px-5 gap-5 bg-white">
          <div className="rounded-full h-2 w-10 bg-zinc-500/30" />
          <div className="w-full flex flex-col items-center">
            <h1 className="text-center text-xl font-bold">Status Order</h1>
            <p className="text-center">Lacak Status Order</p>
          </div>
        </div>
        <div className="w-full px-5 flex flex-col gap-5">
          <Card>
            <CardContent className="pt-6">
              <TimelineProgress progress={order?.status || ""} />
            </CardContent>
          </Card>
          <Card className="w-full border shadow-2xs">
            <CardHeader>
              <CardTitle className="text-lg font-bold tracking-wider">
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
              <div className="flex flex-col gap-3">
                <h3 className="font-semibold text-md">Detail Pelanggan</h3>
                <div className="text-sm text-muted-foreground space-y-2">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4" />
                    <span>{order.customers.username}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4" />
                    <span>{formatPhoneNumber(order.customers.whatsapp)}</span>
                  </div>
                  {order.customers.alamat && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 mt-1" />
                      <span>{order.customers.alamat}</span>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
              <div className="flex flex-col gap-3">
                <h3 className="font-semibold text-md">Detail Order</h3>
                <div className="flex flex-col gap-4">
                  {order?.order_item.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center text-sm"
                    >
                      <div className="flex flex-col">
                        <span className="font-bold">{item.shoe_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {item.service}
                        </span>
                      </div>
                      <span className="font-mono">
                        {formatedCurrency(parseFloat(item.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Separator />
              <div className="w-full flex flex-col gap-2 pt-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">
                    Subtotal
                  </span>
                  <span className="font-mono font-medium">
                    {formatedCurrency(order?.subtotal || 0)}
                  </span>
                </div>
                {order?.order_discounts?.map((discount, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-muted-foreground">
                      Diskon ({discount.discount_code})
                    </span>
                    <span className="font-mono text-green-600">
                      -{formatedCurrency(discount.discounted_amount)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between items-center text-md font-bold pt-2 mt-2 border-t">
                  <span>Total</span>
                  <span className="font-mono">
                    {formatedCurrency(order?.total_price || 0)}
                  </span>
                </div>
              </div>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Metode Pembayaran</span>
                <span>
                  <Badge
                    variant={
                      order.payment === "Pending" ? "destructive" : "default"
                    }
                    className={
                      order.payment !== "Pending"
                        ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-100"
                        : ""
                    }
                  >
                    {order.payment}
                  </Badge>
                </span>
              </div>
            </CardHeader>
          </Card>
          <Button size={"lg"} className="py-[30px] font-bold text-xl">
            Contact Us
          </Button>
        </div>
      </section>
    </main>
  );
}
