"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";
import { formatedCurrency } from "@/lib/utils";
import { QrCode, CheckCircle, Clock, ArrowLeft } from "lucide-react";
import { logger } from "@/utils/client/logger";
import QRCode from "qrcode";
import { generateQRIS } from "@/lib/QRISUtils";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { CustomerService, OrderItemService } from "@/lib/client-services";

// Types
interface DropPointOrderData {
  invoice_id: string;
  fulfillment_type: "drop-point";
  drop_point_id: number;
  items: Array<{
    shoe_name: string;
    custom_shoe_name?: string;
    color: string;
    size: string;
    item_number: number;
    base_price: number;
    add_ons: Array<{
      name: string;
      price: number;
      isAutomatic: boolean;
    }>;
    total_price: number;
    has_white_treatment: boolean;
  }>;
  total_price: number;
  customer_marking: string;
  customer_id: string;
  customer_name: string;
  customer_whatsapp: string;
}

export function DropPointPayment() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get("invoice");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [orderData, setOrderData] = useState<DropPointOrderData | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "processing" | "completed">("pending");
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [shouldGenerateQR, setShouldGenerateQR] = useState(false);

  // Load order data from localStorage
  useEffect(() => {
    if (!invoiceId) {
      toast.error("No invoice ID provided");
      router.push("/drop-point");
      return;
    }

    try {
      const storedData = localStorage.getItem("drop_point_order");
      const customerData = localStorage.getItem("drop_point_customer");

      if (storedData) {
        const parsedData = JSON.parse(storedData) as DropPointOrderData;
        if (parsedData.invoice_id === invoiceId) {
          setOrderData({
            ...parsedData,
            ...(customerData ? JSON.parse(customerData) : {})
          });
        } else {
          toast.error("Order data mismatch");
          router.push("/drop-point");
        }
      } else {
        toast.error("No order data found");
        router.push("/drop-point");
      }
    } catch (error) {
      console.error("Error loading order data:", error);
      toast.error("Failed to load order data");
      router.push("/drop-point");
    }
  }, [invoiceId, router]);

  // Effect to generate QR code when order data is available and user clicks generate
  const generateQRCode = async () => {
    if (!orderData) {
      toast.error("No order data available");
      return;
    }

    setIsGeneratingQR(true);
    setShouldGenerateQR(true);
  };

  // Effect to handle actual QR code generation when shouldGenerateQR is true
  useEffect(() => {
    if (!shouldGenerateQR || !orderData || !canvasRef.current) return;

    const performQRGeneration = async () => {
      try {
        const staticQrisCode = process.env.NEXT_PUBLIC_STATIC_QRIS_CODE;

        if (!staticQrisCode) {
          toast.error("QRIS configuration missing. Please contact support.");
          logger.error("QRIS configuration missing", { envVar: "NEXT_PUBLIC_STATIC_QRIS_CODE" }, "DropPointPayment");
          setIsGeneratingQR(false);
          setShouldGenerateQR(false);
          return;
        }

        logger.info("Generating QR code for payment", {
          invoiceId,
          amount: orderData.total_price,
          staticQrisCodeLength: staticQrisCode.length
        }, "DropPointPayment");

        // Generate dynamic QRIS data
        const dynamicQrisData = generateQRIS(staticQrisCode, orderData.total_price);

        if (!dynamicQrisData) {
          toast.error("Failed to generate QRIS data. Please try again.");
          logger.error("generateQRIS returned null", { amount: orderData.total_price }, "DropPointPayment");
          setIsGeneratingQR(false);
          setShouldGenerateQR(false);
          return;
        }

        // Generate QR code on canvas
        await QRCode.toCanvas(canvasRef.current, dynamicQrisData, {
          width: 300,
          margin: 2,
          errorCorrectionLevel: "H",
        });

        setQrCodeData(dynamicQrisData);
        setPaymentStatus("processing");
        setShouldGenerateQR(false);

        logger.info("QR code generated successfully", {
          invoiceId,
          qrCodeLength: dynamicQrisData.length
        }, "DropPointPayment");

      } catch (error) {
        console.error("Error generating QR code:", error);
        logger.error("QR code generation error", { error, invoiceId }, "DropPointPayment");
        toast.error("Failed to generate QR code. Please try again.");
        setIsGeneratingQR(false);
        setShouldGenerateQR(false);
      }
    };

    // Small delay to ensure canvas is rendered
    const timeoutId = setTimeout(performQRGeneration, 100);

    return () => clearTimeout(timeoutId);
  }, [shouldGenerateQR, orderData, invoiceId]);

  // Handle manual payment confirmation
  const handleConfirmPayment = async () => {
    if (!orderData) return;

    try {
      toast.info("Memproses pembayaran...");
      await processOrderCompletion();
    } catch (error) {
      console.error("Error confirming payment:", error);
      toast.error("Gagal memproses pembayaran. Silakan coba lagi.");
    }
  };

  // Process order completion after successful payment
  const processOrderCompletion = async () => {
    if (!orderData) return;

    try {
      logger.info("Processing order completion", { invoiceId, totalItems: orderData.items.length }, "DropPointPayment");

      const supabase = createClient();

      // Check if customer exists, create if new
      let customerIdToUse = orderData.customer_id;

      // For drop-point orders, we might need to create/update customer record
      const customerData = {
        customer_id: orderData.customer_id,
        username: orderData.customer_name,
        whatsapp: orderData.customer_whatsapp,
        customer_marking: orderData.customer_marking,
      };

      // Check if customer exists
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("customer_id")
        .eq("customer_id", orderData.customer_id)
        .single();

      if (!existingCustomer) {
        // Create new customer without customer_marking (not in schema)
        const customerDataWithoutMarking = {
          customer_id: orderData.customer_id,
          username: orderData.customer_name,
          whatsapp: orderData.customer_whatsapp,
        };
        await CustomerService.createCustomer(customerDataWithoutMarking);
        logger.info("Created new customer for drop-point order", { customerId: orderData.customer_id }, "DropPointPayment");
      }

      // Transform order data for database submission (matching order_item table schema)
      const transformedItems = orderData.items.flatMap((item) =>
        item.services.map((service) => ({
          invoice_id: orderData.invoice_id,
          customer_id: orderData.customer_id,
          customer_name: orderData.customer_name,
          customer_whatsapp: orderData.customer_whatsapp,
          shoe_name: item.shoe_name,
          service: service.name,
          amount: String(service.amount),
          color: item.color,
          size: item.size,
          item_number: item.item_number,
          drop_point_id: orderData.drop_point_id,
          fulfillment_type: orderData.fulfillment_type,
          total_price: item.total_price,
          payment_method: orderData.payment_method,
          payment_status: "paid",
          status: "confirmed",
          has_white_treatment: item.has_white_treatment,
        }))
      );

      // Insert items into order_item table using existing service
      const orderItems = await OrderItemService.createOrderItems(transformedItems);

      if (!orderItems || orderItems.length === 0) {
        logger.error("Failed to insert drop-point order items", { invoiceId }, "DropPointPayment");
        throw new Error("Failed to create order items");
      }

      logger.info("Successfully submitted drop-point order", {
        invoiceId,
        itemCount: transformedItems.length,
        totalPrice: orderData.total_price
      }, "DropPointPayment");

      setPaymentStatus("completed");
      toast.success("Pembayaran Berhasil! Transaksi disimpan.");

      // Clear localStorage
      localStorage.removeItem("drop_point_order");
      localStorage.removeItem("drop_point_customer");

      // Redirect to success page after a short delay
      setTimeout(() => {
        router.push(`/drop-point/success?invoice=${orderData.invoice_id}`);
      }, 2000);

    } catch (error) {
      console.error("Error processing order:", error);
      logger.error("Drop-point order processing failed", { error, invoiceId }, "DropPointPayment");
      toast.error("Order processing failed. Please contact support.");
    }
  };

  // Cancel order
  const handleCancel = () => {
    if (paymentStatus === "processing") {
      toast.warning("Payment is being processed. Please wait or contact support.");
      return;
    }

    localStorage.removeItem("drop_point_order");
    localStorage.removeItem("drop_point_customer");
    router.push("/drop-point");
  };

  if (!orderData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading order data...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="w-full flex flex-col bg-zinc-200 h-full">
      <div className="flex-1 overflow-y-auto flex flex-col py-5 gap-4 px-6">
        {/* Header with back button */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/drop-point")}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <div className="flex-1 text-center">
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
              <span>{orderData.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">WhatsApp:</span>
              <span>{orderData.customer_whatsapp}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Drop-Point ID:</span>
              <span className="font-mono">{orderData.customer_marking}</span>
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
              {orderData.items.map((item, index) => (
                <div key={index} className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium">Item #{item.item_number}</div>
                      <div className="text-sm text-gray-600">{item.shoe_name}</div>
                      <div className="text-sm">Color: {item.color} | Size: {item.size}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatedCurrency(item.total_price)}</div>
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
                <span>Subtotal ({orderData.items.length} items)</span>
                <span>{formatedCurrency(orderData.items.reduce((total, item) => {
                  const servicesTotal = item.services.reduce((serviceTotal, service) => serviceTotal + service.amount, 0);
                  return total + servicesTotal;
                }, 0))}</span>
              </div>

              {/* Show white treatment add-ons separately if they exist */}
              {orderData.items.some(item => item.has_white_treatment) && (
                <div className="flex justify-between text-sm">
                  <span>White Treatment Add-ons</span>
                  <span>{formatedCurrency(orderData.items
                    .filter(item => item.has_white_treatment)
                    .reduce((total, item) => total + 15000, 0))}</span>
                </div>
              )}

              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total Amount</span>
                <span>{formatedCurrency(orderData.items.reduce((total, item) => {
                  const servicesTotal = item.services.reduce((serviceTotal, service) => serviceTotal + service.amount, 0);
                  const whiteTreatmentCost = item.has_white_treatment ? 15000 : 0;
                  return total + servicesTotal + whiteTreatmentCost;
                }, 0))}</span>
              </div>

              {/* Debug info - remove this in production */}
              <div className="text-xs text-gray-500 mt-2">
                Debug: Services Total = {orderData.items.reduce((total, item) => {
                  return total + item.services.reduce((serviceTotal, service) => serviceTotal + service.amount, 0);
                }, 0)},
                White Treatment = {orderData.items.filter(item => item.has_white_treatment).length * 15000},
                Calculated Total = {orderData.items.reduce((total, item) => {
                  const servicesTotal = item.services.reduce((serviceTotal, service) => serviceTotal + service.amount, 0);
                  const whiteTreatmentCost = item.has_white_treatment ? 15000 : 0;
                  return total + servicesTotal + whiteTreatmentCost;
                }, 0)},
                Expected (orderData.total_price) = {orderData.total_price}
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
              <div className="mb-4">
                <Image
                  src={"/qris-logo.png"}
                  width={100}
                  height={40}
                  alt={"Logo QRIS"}
                  className="mx-auto mb-4"
                />
              </div>

              <div className="space-y-4">
                {/* Always render canvas but conditionally display content */}
                <div className="mb-6 flex justify-center">
                  <canvas
                    ref={canvasRef}
                    className="border border-gray-200 rounded"
                    style={{ display: qrCodeData ? 'block' : 'none' }}
                    width={300}
                    height={300}
                  />
                </div>

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
                    <div className="mb-4">
                      <p className="text-lg">Total Tagihan:</p>
                      <p className="text-3xl font-bold text-blue-600 font-mono">
                        {formatedCurrency(orderData.total_price)}
                      </p>
                    </div>

                    <div className="space-y-2 text-sm">
                      <p className="font-medium">Scan QR Code dengan QRIS app</p>
                      <p className="text-gray-600">Merchant: InspirasiNEE Drop-Point</p>
                    </div>
                  </div>
                )}
              </div>
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
                <li>You'll receive your drop-point customer ID for tracking</li>
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
          {qrCodeData && paymentStatus === "processing" && (
            <Button
              onClick={handleConfirmPayment}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Confirm Payment
            </Button>
          )}
          {paymentStatus === "completed" && (
            <Button
              onClick={() => router.push("/drop-point")}
              className="flex-1"
            >
              Back to Drop-Points
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}