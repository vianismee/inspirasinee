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
import { useOrderStore } from "@/stores/orderStore";
import { useEffect } from "react";
import { formatedCurrency } from "@/lib/utils";
import { Logo } from "../Logo";
import { Wallet2 } from "lucide-react";
import { TrackingError } from "./TrackingError";

interface TrackingAppProps {
  params: string;
}

export function TrackingApp({ params }: TrackingAppProps) {
  const { fetchOrder, subscribeToOrders, singleOrders, isLoading } =
    useOrderStore();

  useEffect(() => {
    fetchOrder(params);
    const unscubscribe = subscribeToOrders(params);
    return () => {
      unscubscribe();
    };
  }, [fetchOrder, subscribeToOrders, params]);
  if (isLoading) {
    return <div>Loading ...</div>;
  }

  if (!singleOrders) {
    return <TrackingError params={params} />;
  }

  return (
    <main className="w-full bg-white max-w-2xl">
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
            <h1 className="text-center text-xl font-bold">
              Technician Cleaning Process
            </h1>
            <p className="text-center">
              Hmmm- Your shoe status is Cleaning Process
            </p>
          </div>
        </div>
        <div className="w-full px-5 flex flex-col gap-5">
          <Card>
            <CardContent>
              <TimelineProgress progress={singleOrders?.status || ""} />
            </CardContent>
          </Card>
          <Card className="w-full border shadow-2xs">
            <CardHeader>
              <CardTitle className="inline-flex items-center justify-between">
                Order Details<span>{singleOrders?.invoice_id}</span>
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent>
              <div className="flex flex-col gap-5">
                {singleOrders?.order_item.map((order) => (
                  <div className="flex flex-col gap-1" key={order.shoe_name}>
                    <h1 className="font-bold">{order.shoe_name}</h1>
                    <div className="flex justify-between text-black font-ligt">
                      <p>{order.service}</p>
                      <p>{formatedCurrency(parseFloat(order.amount))}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <Separator />
            <CardFooter className="flex flex-col gap-5">
              <div className="w-full inline-flex items-center justify-between">
                <h1 className="font-bold">Sub Total</h1>
                <h1 className="font-bold">
                  {formatedCurrency(singleOrders?.subtotal || 0)}
                </h1>
              </div>
              {singleOrders?.order_discounts &&
                singleOrders.order_discounts.map((discount, index) => (
                  <div className="flex justify-between w-full" key={index}>
                    <h1 className="w-[180px]">{discount.discount_code}</h1>
                    <p>{`(${formatedCurrency(discount.discounted_amount)})`}</p>
                  </div>
                ))}
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="inline-flex gap-2 items-center font-bold">
                  <Wallet2 />
                  Metode Pembayaran
                </div>
                <h1>{singleOrders?.payment}</h1>
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="">
            <CardHeader className="">
              <CardTitle className="flex items-center justify-between">
                <h1 className="inline-flex items-center gap-2 font-bold text-xl">
                  TOTAL
                </h1>
                <h1 className="text-xl font-bold">
                  {formatedCurrency(singleOrders?.total_price || 0)}
                </h1>
              </CardTitle>
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
