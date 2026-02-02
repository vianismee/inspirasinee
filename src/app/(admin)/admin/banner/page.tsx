"use client";

import { BannerApp } from "@/components/Banner/BannerApp";
import { useBannerStore } from "@/stores/bannerStore";
import { useEffect } from "react";

export default function BannerPage() {
  const { fetchBanners, subscribeToChanges } = useBannerStore();

  useEffect(() => {
    fetchBanners();
    const unsubscribe = subscribeToChanges();
    return () => unsubscribe();
  }, [fetchBanners, subscribeToChanges]);

  return <BannerApp />;
}
