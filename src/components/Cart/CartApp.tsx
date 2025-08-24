"use client";

import { useCustomerStore } from "@/stores/customerStore";

export function CartApp() {
  const activeCustomer = useCustomerStore((state) => state.activeCustomer);
  return <section>Nama: {activeCustomer?.customer}</section>;
}
