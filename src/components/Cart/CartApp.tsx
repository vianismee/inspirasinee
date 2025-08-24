"use client";

import { useCustomerStore } from "@/stores/customerStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function CartApp() {
  const activeCustomer = useCustomerStore((state) => state.activeCustomer);
  const router = useRouter();
  useEffect(() => {
    if (!activeCustomer) {
      router.replace("/admin/input/");
    }
  }, [activeCustomer, router]);
  return <section>Nama: {activeCustomer?.customer}</section>;
}
