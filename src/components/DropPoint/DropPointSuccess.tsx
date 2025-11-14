"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { CheckCircle, Package, MapPin, Phone, ArrowLeft } from "lucide-react";

export function DropPointSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get("invoice");

  useEffect(() => {
    if (!invoiceId) {
      router.push("/drop-point");
    }
  }, [invoiceId, router]);

  const handleNewOrder = () => {
    router.push("/drop-point");
  };

  return (
    <section className="w-full flex flex-col bg-zinc-200 h-full">
      <div className="flex-1 overflow-y-auto flex flex-col py-5 gap-4 px-6">
        {/* Success Header */}
        <Card>
          <CardContent className="pt-6 pb-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-green-600 mb-2">Order Confirmed!</h1>
              <p className="text-gray-600">Your drop-point order has been successfully processed</p>
              {invoiceId && (
                <div className="mt-4">
                  <Badge variant="outline" className="text-lg px-4 py-2">
                    INVOICE: {invoiceId}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <h4 className="font-medium text-blue-900">Drop-Point Location</h4>
                </div>
                <p className="text-sm text-blue-800">Main Drop-Point</p>
                <p className="text-sm text-blue-700">Jl. Sudirman No. 123, Jakarta</p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <h4 className="font-medium text-green-900">Payment Status</h4>
                </div>
                <p className="text-sm text-green-800">Paid via QRIS</p>
                <p className="text-sm text-green-700">Transaction completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">1</span>
                </div>
                <div>
                  <h4 className="font-medium">Item Processing</h4>
                  <p className="text-sm text-gray-600">Your items will be processed with the selected services</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">2</span>
                </div>
                <div>
                  <h4 className="font-medium">Quality Check</h4>
                  <p className="text-sm text-gray-600">Each item goes through quality assurance</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">3</span>
                </div>
                <div>
                  <h4 className="font-medium">Return to Drop-Point</h4>
                  <p className="text-sm text-gray-600">Items will be returned to the selected drop-point location</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">4</span>
                </div>
                <div>
                  <h4 className="font-medium">Pickup Notification</h4>
                  <p className="text-sm text-gray-600">You'll be notified when items are ready for pickup</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Information */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900">Need Help?</h4>
                  <p className="text-gray-600">Contact our support team for any questions about your order</p>
                </div>
              </div>

              <div className="border-t pt-3">
                <h4 className="font-medium text-gray-900 mb-2">Remember:</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Keep your invoice ID for order tracking</li>
                  <li>Items will be numbered for easy identification</li>
                  <li>Bring your ID when picking up items</li>
                  <li>Quality guarantee applies to all services</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleNewOrder}
            className="flex-1"
          >
            <Package className="h-4 w-4 mr-2" />
            New Drop-Point Order
          </Button>
        </div>
      </div>
    </section>
  );
}