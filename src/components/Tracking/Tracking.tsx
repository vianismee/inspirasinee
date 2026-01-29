"use client";

import { useState, useEffect } from "react";
import { useOrderStore } from "@/stores/orderStore";
import { TrackingError } from "./TrackingError";
import { useIsMobile } from "@/hooks/use-mobile";
import { TrackingDesktop } from "./TrackingDesktop";
import { TrackingMobile } from "./TrackingMobile";
import { PointsData, ReferralData, AdConfig, DUMMY_ADS } from "@/types/tracking";
import { fetchCustomerPointsDataClient, fetchCustomerReferralDataClient } from "@/lib/tracking-data-client";
import { Loader2 } from "lucide-react";

interface TrackingPageProps {
  params: string;
}

export function TrackingApp({ params }: TrackingPageProps) {
  const { fetchOrder, subscribeToOrders, singleOrders, isLoading } =
    useOrderStore();

  const isMobile = useIsMobile();

  // Enrichment data states
  const [pointsData, setPointsData] = useState<PointsData | null>(null);
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [enrichmentLoading, setEnrichmentLoading] = useState(true);

  // Fetch order data
  useEffect(() => {
    fetchOrder({ invoice: params });
    const unsubscribe = subscribeToOrders(params);
    return () => unsubscribe();
  }, [fetchOrder, subscribeToOrders, params]);

  // Fetch enrichment data when order is loaded
  useEffect(() => {
    const fetchEnrichmentData = async () => {
      if (!singleOrders?.customer_id) return;

      setEnrichmentLoading(true);

      try {
        const customerId = singleOrders.customer_id;

        // Fetch points and referral data in parallel
        const [points, referral] = await Promise.all([
          fetchCustomerPointsDataClient(customerId),
          fetchCustomerReferralDataClient(customerId),
        ]);

        setPointsData(points);
        setReferralData(referral);
      } catch (error) {
        console.error("Error fetching enrichment data:", error);
      } finally {
        setEnrichmentLoading(false);
      }
    };

    fetchEnrichmentData();
  }, [singleOrders?.customer_id]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!singleOrders) {
    return <TrackingError params={params} />;
  }

  // Use dummy ads
  const ads: AdConfig[] = DUMMY_ADS;

  // Pass enrichment data to components
  const commonProps = {
    order: singleOrders,
    pointsData: pointsData || undefined,
    referralData: referralData,
    ads,
  };

  return isMobile ? (
    <TrackingMobile {...commonProps} />
  ) : (
    <TrackingDesktop {...commonProps} />
  );
}
