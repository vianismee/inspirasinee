"use client";
import TableJob from "@/components/Dashboard/TableJob";
import TableSkeleton from "@/components/Dashboard/TableSekeleton";
import { Headers } from "@/components/MainComponent/Header";
import { PlusCircle } from "lucide-react";
import { Suspense } from "react";

export default function Page() {
  return (
    <div className="w-full  h-screen px-[30px] py-[30px]">
      <div className="flex flex-col gap-4">
        <Headers
          title="Dashboard"
          desc="Admin dashbord untuk update Tracking"
          buttonTitle="Tambah Order"
          href="/admin/order"
          icon={PlusCircle}
        />
        <Suspense fallback={<TableSkeleton />}>
          <TableJob />
        </Suspense>
      </div>
    </div>
  );
}
