// components/Dashboard/TableSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function TableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="rounded-md border">
        <Skeleton className="h-[400px] w-full" />
      </div>
    </div>
  );
}
