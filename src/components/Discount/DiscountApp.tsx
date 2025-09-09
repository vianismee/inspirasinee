import { Headers } from "../MainComponent/Header";
import { Suspense } from "react";
import TableSkeleton from "../Dashboard/TableSekeleton";
import { DiscountTable } from "./DiscountTable";

export function DiscountApp() {
  return (
    <div className="w-full  h-screen px-[30px] py-[30px]">
      <div className="flex flex-col">
        <Headers title="Discount" desc="Manage Discount" />
        <Suspense fallback={<TableSkeleton />}>
          <DiscountTable />
        </Suspense>
      </div>
    </div>
  );
}
