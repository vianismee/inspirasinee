"use client";

import { Suspense } from "react";
import { Headers } from "@/components/MainComponent/Header";
import { Users, BarChart3, Download } from "lucide-react";
import { DropPointCustomerTable } from "@/components/Admin/DropPointCustomerTable";
import { CustomerAnalytics } from "@/components/Admin/CustomerAnalytics";
import { TableSkeleton } from "@/components/Dashboard/TableSekeleton";

export default function DropPointCustomersPage() {
  return (
    <div className="w-full h-screen px-[30px] py-[30px]">
      <div className="flex flex-col gap-6">
        <Headers
          title="Drop-Point Customers"
          desc="Manage drop-point customers and track analytics"
          buttonTitle="Export Data"
          href="#"
          icon={Download}
        />

        {/* Customer Analytics Overview */}
        <Suspense fallback={<TableSkeleton />}>
          <CustomerAnalytics />
        </Suspense>

        {/* Customer Table */}
        <Suspense fallback={<TableSkeleton />}>
          <DropPointCustomerTable />
        </Suspense>
      </div>
    </div>
  );
}