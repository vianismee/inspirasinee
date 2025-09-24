"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CartApp } from "@/components/Cart/CartApp";
import { useCustomerStore } from "@/stores/customerStore";

interface AdminCartWrapperProps {
  customerId?: string;
}

export function AdminCartWrapper({ customerId }: AdminCartWrapperProps) {
  const router = useRouter();
  const { activeCustomer } = useCustomerStore();

  useEffect(() => {
    // If no customer is selected and no customerId is provided, redirect to customer selection
    if (!activeCustomer && !customerId) {
      router.push("/admin/order/");
    }
  }, [activeCustomer, customerId, router]);

  // If no customer is available yet, show loading
  if (!activeCustomer && !customerId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading customer data...</p>
        </div>
      </div>
    );
  }

  return <CartApp />;
}