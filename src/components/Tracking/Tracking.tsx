"use client";

import { useOrderStore } from "@/stores/orderStore";
import { useEffect } from "react";
import { TrackingError } from "./TrackingError";
import { useIsMobile } from "@/hooks/use-mobile"; // <<< UBAH: Impor hook baru
import { TrackingDesktop } from "./TrackingDesktop";
import { TrackingMobile } from "./TrackingMobile";

interface TrackingPageProps {
  params: string;
}

export function TrackingApp({ params }: TrackingPageProps) {
  const { fetchOrder, subscribeToOrders, singleOrders, isLoading } =
    useOrderStore();

  // <<< UBAH: Gunakan hook useIsMobile
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchOrder({ invoice: params });
    const unsubscribe = subscribeToOrders(params);
    return () => unsubscribe();
  }, [fetchOrder, subscribeToOrders, params]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!singleOrders) {
    return <TrackingError params={params} />;
  }

  // <<< UBAH: Sesuaikan logika render dengan hasil dari useIsMobile
  return isMobile ? (
    <TrackingMobile order={singleOrders} />
  ) : (
    <TrackingDesktop order={singleOrders} />
  );
}
