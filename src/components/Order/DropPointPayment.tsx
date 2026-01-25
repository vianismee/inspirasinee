"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";
import { formatedCurrency } from "@/lib/utils";
import { QrCode, CheckCircle, Clock, ArrowLeft, Loader2 } from "lucide-react";
import { DropPointCRUDService } from "@/lib/client-services";

// Types
interface DropPointOrderData {
  invoice_id: string;
  customer_id: string;
  customer_marking: string;
  total_price: number;
  subtotal: number;
  status: string;
  drop_point_id: number;
  customers: {
    customer_id: string;
    username: string;
    whatsapp: string;
    email: string | null;
  } | null;
  drop_points: {
    id: number;
    name: string;
    address: string;
  } | null;
  order_item: Array<{
    id: number;
    shoe_name: string;
    color: string;
    size: string;
    item_number: number;
    amount: number;
    has_white_treatment: boolean;
  }>;
}

export function DropPointPayment() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get("invoice");

  const [orderData, setOrderData] = useState<DropPointOrderData | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "processing" | "completed">("pending");
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load order data from Supabase
  const loadOrderData = useCallback(async () => {
    if (!invoiceId) {
      toast.error("No invoice ID provided");
      router.push("/admin/drop-point");
      return;
    }

    try {
      setIsLoading(true);
      const order = await DropPointCRUDService.getOrderByInvoice(invoiceId);
      
      if (order) {
        setOrderData(order as DropPointOrderData);
        // Check if already paid
        if (order.status === 'confirmed' || order.status === 'completed') {
          setPaymentStatus("completed");
        }
      } else {
        toast.error("Order not found");
        router.push("/admin/drop-point");
      }
    } catch (error) {
      console.error("Error loading order data:", error);
      toast.error("Failed to load order data");
      router.push("/admin/drop-point");
    } finally {
      setIsLoading(false);
    }
  }, [invoiceId, router]);

  useEffect(() => {
    loadOrderData();
  }, [loadOrderData]);

  // Generate QR Code for QRIS payment
  const generateQRCode = async () => {
    if (!orderData) return;

    setIsGeneratingQR(true);
    try {
      // In a real implementation, this would call your payment gateway API
      // For now, we'll simulate QR code generation
      const qrPayload = {
        invoice_id: orderData.invoice_id,
        amount: orderData.total_price,
        customer_id: orderData.customer_id,
        payment_method: "QRIS",
        merchant_name: "InspirasiNEE",
        timestamp: new Date().toISOString(),
      };

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Generate a mock QR code URL (in production, this would come from the payment gateway)
      const qrCodeUrl = `https://api.qris.example.com/qr?data=${btoa(JSON.stringify(qrPayload))}`;
      setQrCodeData(qrCodeUrl);
      setPaymentStatus("processing");

      // Start checking payment status
      startPaymentStatusCheck();

    } catch (error) {
      console.error("Error generating QR code:", error);
      toast.error("Failed to generate QR code. Please try again.");
    } finally {
      setIsGeneratingQR(false);
    }
  };

  // Simulate payment status checking
  const startPaymentStatusCheck = () => {
    // In production, this would poll the payment gateway API
    const statusCheckInterval = setInterval(() => {
      // Simulate payment completion after 10 seconds
      const randomDelay = Math.random() * 10000 + 5000; // 5-15 seconds

      setTimeout(() => {
        clearInterval(statusCheckInterval);
        setPaymentStatus("completed");
        toast.success("Payment completed successfully!");
        processOrderCompletion();
      }, randomDelay);
    }, 2000);
  };

  // Process order completion after successful payment
  const processOrderCompletion = async () => {
    if (!orderData) return;

    try {
      // Update payment status in Supabase
      const result = await DropPointCRUDService.updatePaymentStatus(orderData.invoice_id, 'paid');

      if (!result.success) {
        throw new Error("Failed to update payment status");
      }

      console.log("Payment completed for order:", orderData.invoice_id);

      // Redirect to success page after a short delay
      setTimeout(() => {
        router.push(`/admin/drop-point/success?invoice=${orderData.invoice_id}`);
      }, 2000);

    } catch (error) {
      console.error("Error processing order:", error);
      toast.error("Order processing failed. Please contact support.");
    }
  };

  // Cancel order
  const handleCancel = () => {
    if (paymentStatus === "processing") {
      toast.warning("Payment is being processed. Please wait or contact support.");
      return;
    }

    router.push("/admin/drop-point");
  };

  if (isLoading || !orderData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p>Loading order data...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="w-full flex flex-col bg-zinc-200 h-full">
      <div className="flex-1 overflow-y-auto flex flex-col py-5 gap-4 px-6">
        {/* Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-xl">DROP-POINT PAYMENT</div>
                <div className="text-sm text-gray-600">INVOICE ID: {invoiceId}</div>
              </div>
              <Badge variant={paymentStatus === "completed" ? "default" : paymentStatus === "processing" ? "secondary" : "outline"}>
                {paymentStatus === "completed" ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Paid
                  </>
                ) : paymentStatus === "processing" ? (
                  <>
                    <Clock className="w-3 h-3 mr-1" />
                    Processing
                  </>
                ) : (
                  "Pending"
                )}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="font-medium">Name:</span>
              <span>{orderData.customers?.username || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">WhatsApp:</span>
              <span>{orderData.customers?.whatsapp || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Drop-Point ID:</span>
              <span className="font-mono">{orderData.customer_marking}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Location:</span>
              <span>{orderData.drop_points?.name || '-'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <div className="space-y-3">
              {orderData.order_item?.map((item) => (
                <div key={item.id} className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium">Item #{item.item_number}</div>
                      <div className="text-sm text-gray-600">{item.shoe_name}</div>
                      <div className="text-sm">Color: {item.color} | Size: {item.size}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatedCurrency(item.amount)}</div>
                      {item.has_white_treatment && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          + White Treatment
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal ({orderData.order_item?.length || 0} items)</span>
                <span>{formatedCurrency(orderData.subtotal || 0)}</span>
              </div>

              {orderData.order_item?.some(item => item.has_white_treatment) && (
                <div className="flex justify-between text-sm">
                  <span>White Treatment Add-ons</span>
                  <span>{formatedCurrency(
                    (orderData.order_item?.filter(item => item.has_white_treatment).length || 0) * 15000
                  )}</span>
                </div>
              )}

              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total Amount</span>
                <span>{formatedCurrency(orderData.total_price)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QRIS Payment
            </CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <div className="text-center">
              {!qrCodeData ? (
                <div className="space-y-4">
                  <div className="p-8 bg-gray-100 rounded-lg">
                    <QrCode className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">QR Code will appear here</p>
                  </div>
                  <Button
                    onClick={generateQRCode}
                    disabled={isGeneratingQR}
                    className="w-full"
                    size="lg"
                  >
                    {isGeneratingQR ? "Generating QR Code..." : "Generate QRIS QR Code"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-8 bg-white border-2 border-gray-200 rounded-lg">
                    {/* In production, this would be an actual QR code image */}
                    <div className="w-48 h-48 mx-auto bg-gray-900 rounded-lg flex items-center justify-center">
                      <QrCode className="h-32 w-32 text-white" />
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">Scan QR Code with your QRIS app</p>
                    <p className="text-gray-600">Amount: {formatedCurrency(orderData.total_price)}</p>
                    <p className="text-gray-600">Merchant: InspirasiNEE</p>
                    {paymentStatus === "processing" && (
                      <div className="flex items-center justify-center gap-2 text-blue-600">
                        <Clock className="h-4 w-4 animate-spin" />
                        <span>Awaiting payment confirmation...</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Important Information */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2 text-sm text-gray-600">
              <p className="font-semibold text-gray-900">Important Information:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>QRIS is the only payment method for drop-point orders</li>
                <li>Items will be numbered automatically upon order confirmation</li>
                <li>You&apos;ll receive your drop-point customer ID for tracking</li>
                <li>Items will be processed and returned to the selected drop-point location</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={paymentStatus === "processing"}
            className="flex-1"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancel Order
          </Button>
          {paymentStatus === "completed" && (
            <Button
              onClick={() => router.push("/admin")}
              className="flex-1"
            >
              Back to Dashboard
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}