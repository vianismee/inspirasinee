import { Headers } from "../MainComponent/Header";
import { Suspense } from "react";
import TableSkeleton from "../Dashboard/TableSekeleton";
import { MembershipTable } from "./MembershipTable";

export function MembershipApp() {
  return (
    <div className="w-full h-screen px-[30px] py-[30px]">
      <div className="flex flex-col">
        <Headers
          title="Membership"
          desc="Configure membership tiers and benefits"
        />
        <Suspense fallback={<TableSkeleton />}>
          <MembershipTable />
        </Suspense>
      </div>
    </div>
  );
}
