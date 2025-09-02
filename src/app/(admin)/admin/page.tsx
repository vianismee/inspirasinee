"use client";
import TableJob from "@/components/Dashboard/TableJob";
import TableSkeleton from "@/components/Dashboard/TableSekeleton";
import { Headers } from "@/components/MainComponent/Header";
import { Suspense } from "react";

export default function Page() {
  return (
    <div className="flex flex-col py-4 md:gap-6 md:py-6 px-6">
      <Headers title="Dashboard" desc="Admin dashbord untuk update Tracking" />
      <Suspense fallback={<TableSkeleton />}>
        <TableJob />
      </Suspense>
    </div>
  );
}
