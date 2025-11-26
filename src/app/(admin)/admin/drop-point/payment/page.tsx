import { Suspense } from "react";
import { DropPointPayment } from "@/components/Order/DropPointPayment";

export default function DropPointPaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <DropPointPayment />
    </Suspense>
  );
}