"use client";

import { useAdminOrder } from "@/stores/adminOrderStore";
import React from "react";

export default function CustomerPage() {
  const { isLoading, orders, fetchOrder } = useAdminOrder();
  React.useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);
  if (isLoading) {
    return <div>Loading...</div>;
  }
  return (
    <div>
      <pre>{JSON.stringify(orders, null, 2)}</pre>
    </div>
  );
}
