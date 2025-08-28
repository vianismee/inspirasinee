"use client";
import { useOrderStore } from "@/stores/orderStore";
import { useEffect } from "react";

export default function InputPage() {
  const { orders, fetchOrder, subscribeToOrders, singleOrders } =
    useOrderStore();

  useEffect(() => {
    fetchOrder();
    const unscubscribe = subscribeToOrders();
    return () => {
      unscubscribe();
    };
  }, [fetchOrder, subscribeToOrders]);

  console.log(orders);
  console.log(singleOrders);
  return (
    <div>
      {" "}
      <pre>{JSON.stringify(orders, null, 2)}</pre>
    </div>
  );
}
