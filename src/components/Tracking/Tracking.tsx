"use client";

import { useState, useEffect, useCallback } from "react";
import { TrackingError } from "./TrackingError";
import { useIsMobile } from "@/hooks/use-mobile";
import { TrackingDesktop } from "./TrackingDesktop";
import { TrackingMobile } from "./TrackingMobile";
import { simpleTrackingService, SimpleOrderData, CustomerInfo, SimpleOrderItem } from "@/lib/simple-tracking-service";

interface TrackingPageProps {
  params: string;
}

export function TrackingApp({ params }: TrackingPageProps) {
  const [orderData, setOrderData] = useState<SimpleOrderData | null>(null);
  const [customerData, setCustomerData] = useState<CustomerInfo | null>(null);
  const [itemsData, setItemsData] = useState<SimpleOrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const loadOrderData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Use simple tracking service - NO complex processing
      const result = await simpleTrackingService.getFullOrderData(params);

      if (!result.order) {
        setError('Order not found');
        return;
      }

      setOrderData(result.order);
      setCustomerData(result.customer);
      setItemsData(result.items);
    } catch (err) {
      console.error('Tracking error:', err);
      setError('Failed to load order data');
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    loadOrderData();
  }, [loadOrderData]);

  // Combine data for existing UI components - match expected Orders type
  const combinedOrderData = orderData ? {
    ...orderData,
    customer_name: customerData?.name || 'Guest Customer',
    customer_phone: customerData?.phone || 'N/A',
    order_item: itemsData.map(item => ({
      id: item.id,
      service_name: item.service_name,
      shoe_name: item.shoe_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      notes: item.notes,
      services: [{
        id: item.id,
        service: item.service_name,
        amount: item.unit_price.toString()
      }]
    })),
    order_discounts: [],
    // Add missing required properties
    customers: {
      name: customerData?.name || 'Guest Customer',
      phone: customerData?.phone || 'N/A',
      email: customerData?.email || '',
      customer_id: orderData.customer_id || 'guest',
      username: 'guest',
      whatsapp: customerData?.phone || 'N/A'
    },
    payment: orderData.payment_method || 'transfer'
  } : null;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order information...</p>
        </div>
      </div>
    );
  }

  if (error || !combinedOrderData) {
    return <TrackingError params={params} error={error} />;
  }

  return isMobile ? (
    <TrackingMobile order={combinedOrderData} />
  ) : (
    <TrackingDesktop order={combinedOrderData} />
  );
}
