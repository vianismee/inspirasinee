import { Suspense } from "react";
import { DropPointSuccess } from "@/components/DropPoint/DropPointSuccess";

export default function DropPointSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <DropPointSuccess />
    </Suspense>
  );
}