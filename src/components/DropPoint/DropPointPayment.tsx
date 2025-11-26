"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatedCurrency } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { logger } from "@/utils/client/logger";
import QRCode from "qrcode";
import { generateQRIS } from "@/lib/QRISUtils";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { setDropPointDataCookie } from "@/lib/cookieUtils";

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
    services: Array<{ name: string; amount: number }>;
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
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "processing" | "completed">("pending");
  const [shouldGenerateQR, setShouldGenerateQR] = useState(false);
  const [paymentRef, setPaymentRef] = useState("");
  const [showQR, setShowQR] = useState(false);

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

  // Effect to generate QR code when user clicks proceed
  useEffect(() => {
    if (!shouldGenerateQR || !orderData || !canvasRef.current) return;

    const performQRGeneration = async () => {
      try {
        const staticQrisCode = process.env.NEXT_PUBLIC_STATIC_QRIS_CODE;

        if (!staticQrisCode) {
          toast.error("QRIS configuration missing.");
          setShouldGenerateQR(false);
          return;
        }

        // Generate dynamic QRIS data
        const dynamicQrisData = generateQRIS(staticQrisCode, orderData.total_price);

        if (!dynamicQrisData) {
          toast.error("Failed to generate QRIS data.");
          setShouldGenerateQR(false);
          return;
        }

        // Generate QR code on canvas
        await QRCode.toCanvas(canvasRef.current, dynamicQrisData, {
          width: 300,
          margin: 2,
          errorCorrectionLevel: "H",
        });

        // Don't set processing yet, wait for user confirmation
        // setPaymentStatus("processing");
        setShouldGenerateQR(false);

      } catch (error) {
        console.error("Error generating QR code:", error);
        toast.error("Failed to generate QR code.");
        setShouldGenerateQR(false);
      }
    };

    const timeoutId = setTimeout(performQRGeneration, 100);
    return () => clearTimeout(timeoutId);
  }, [shouldGenerateQR, orderData, invoiceId]);

  const handleProceedToPayment = () => {
      setShowQR(true);
      setShouldGenerateQR(true);
  };

  // Handle manual payment confirmation
  const handleConfirmPayment = async () => {
    if (!orderData) return;

    if (!paymentRef || paymentRef.length < 4) {
        toast.error("Mohon isi 4 digit nomor referensi pembayaran untuk verifikasi");
        return;
    }

    try {
      setPaymentStatus("processing");
      toast.info("Memproses pembayaran...");
      await processOrderCompletion();
    } catch (error) {
      setPaymentStatus("pending");
      console.error("Error confirming payment:", error);
      toast.error("Gagal memproses pembayaran. Silakan coba lagi.");
    }
  };

  // Process order completion after successful payment
  const processOrderCompletion = async () => {
    if (!orderData) return;

    // --- SIMULATION MODE (for demo purposes) ---
    try {
        setPaymentStatus("processing");
        toast.info("Processing your order and assigning shelves...");

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Generate realistic shelf assignments (sequential A1, A2, A3, etc.)
        const assignedShelves = orderData.items.map((item, index) => {
            return {
                item_number: item.item_number,
                shelf_number: `${String.fromCharCode(65 + (index % 26))}${index + 1}`, // A1, A2, A3, ...
                shoe_name: item.shoe_name
            };
        });

        logger.info("Successfully assigned shelves", { assignedShelves }, "DropPointPayment");

        // Store assignments for the Success Page
        localStorage.setItem("assigned_shelves", JSON.stringify(assignedShelves));

        // Store data in cookies for customer access
        const cookieData = {
          customerName: orderData.customer_name,
          customerPhone: orderData.customer_whatsapp,
          items: orderData.items.map((item, index) => ({
            code: assignedShelves[index]?.shelf_number || `${String.fromCharCode(65 + index)}${index + 1}`, // A1, A2, A3 format
            shoeName: item.shoe_name,
            color: item.color,
            size: item.size,
            services: item.services,
            totalPrice: item.total_price
          })),
          subtotal: orderData.total_price,
          total: orderData.total_price,
          verificationCode: paymentRef
        };
        setDropPointDataCookie(cookieData);

        // Store completed order data (keep it, don't clear it yet)
        localStorage.setItem("completed_order", JSON.stringify({
            invoice_id: orderData.invoice_id,
            customer_name: orderData.customer_name,
            customer_whatsapp: orderData.customer_whatsapp,
            items: orderData.items,
            total_price: orderData.total_price,
            payment_reference: paymentRef,
            assigned_shelves: assignedShelves
        }));

        setPaymentStatus("completed");
        toast.success("Payment successful! Your items have been assigned shelves.");

        // Clear ONLY the pending order data (keep completed order for viewing)
        localStorage.removeItem("drop_point_order");
        localStorage.removeItem("drop_point_customer");

        // Direct to Success Page with location
        setTimeout(() => {
            // Use a generic location slug since we don't have the location name
            const locationSlug = orderData.drop_point_id ? `location-${orderData.drop_point_id}` : 'success';
            router.push(`/drop-point/${locationSlug}/success?invoice=${orderData.invoice_id}`);
        }, 1500);

    } catch (error) {
        console.error("Order processing error:", error);
        toast.error("Failed to process order. Please try again.");
        setPaymentStatus("pending");
    }
  };

  const handleCancel = () => {
    localStorage.removeItem("drop_point_order");
    localStorage.removeItem("drop_point_customer");
    router.push("/drop-point");
  };

  if (!orderData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (showQR) {
      return (
        <div className="min-h-screen bg-gray-50 font-sans pb-20">
            <div className="w-full max-w-xl mx-auto px-4 py-8">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Scan to Pay</h1>
                    <p className="text-gray-500">Complete your payment via QRIS</p>
                </div>

                <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden mb-6">
                    <div className="p-8 text-center">
                        <Image src={"/qris-logo.png"} width={100} height={40} alt={"Logo QRIS"} className="mx-auto mb-6" />
                        
                        <div className="mb-6 flex justify-center">
                            <div className="p-4 bg-white rounded-2xl border-2 border-gray-100 shadow-sm">
                                <canvas ref={canvasRef} width={250} height={250} style={{ imageRendering: 'crisp-edges' }} />
                            </div>
                        </div>

                        <div className="text-left space-y-4">
                            <div className="bg-blue-50 p-4 rounded-xl text-blue-800 text-sm text-center">
                                Total: <span className="font-bold text-lg">{formatedCurrency(orderData.total_price)}</span>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Payment Verification
                                </label>
                                <p className="text-xs text-gray-500 mb-3">
                                    Enter the last 4 digits of the Ref No. / No. Referensi from your payment app proof.
                                </p>
                                <Input
                                    placeholder="e.g. 8821"
                                    value={paymentRef}
                                    onChange={(e) => setPaymentRef(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                    maxLength={4}
                                    className="h-14 text-center text-2xl tracking-[0.5em] font-bold bg-white border-gray-300 rounded-xl"
                                />
                            </div>
                        </div>

                        <Button
                            onClick={handleConfirmPayment}
                            disabled={paymentStatus === "processing" || paymentRef.length < 4}
                            className="w-full h-14 text-lg rounded-xl bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200 mt-6"
                        >
                            {paymentStatus === "processing" ? "Verifying..." : "Verify & Finish"}
                        </Button>
                        
                        <Button
                            variant="ghost"
                            onClick={() => setShowQR(false)}
                            className="mt-4 text-gray-400"
                        >
                            Back to Invoice
                        </Button>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      <div className="w-full max-w-2xl mx-auto px-4 py-8">
        
        {/* Header Steps */}
        <div className="mb-8 flex items-center justify-between text-sm font-medium text-gray-400">
            <div className="flex items-center text-blue-600 cursor-pointer" onClick={() => router.back()}>
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2 text-sm font-bold">✓</div>
                Details
            </div>
            <div className="h-px bg-blue-200 flex-1 mx-4"></div>
            <div className="flex items-center text-blue-600 cursor-pointer" onClick={() => router.back()}>
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2 text-sm font-bold">✓</div>
                Items
            </div>
            <div className="h-px bg-blue-200 flex-1 mx-4"></div>
             <div className="flex items-center text-blue-600">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center mr-2 text-sm font-bold">3</div>
                Review
            </div>
        </div>

        {/* Invoice Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-6 relative">
            {/* Decorative Top */}
            <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 w-full"></div>
            
            <div className="p-8">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Invoice</h1>
                        <p className="text-sm text-gray-500">Order #{invoiceId}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-gray-400 uppercase tracking-wider font-bold">Date</div>
                        <div className="text-sm font-medium text-gray-700">{new Date().toLocaleDateString()}</div>
                    </div>
                </div>

                <div className="mb-8 p-4 bg-gray-50 rounded-xl">
                    <div className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-2">Customer</div>
                    <div className="font-bold text-gray-900">{orderData.customer_name}</div>
                    <div className="text-sm text-gray-500">{orderData.customer_whatsapp}</div>
                </div>

                <div className="space-y-4 mb-8">
                    <div className="text-xs text-gray-400 uppercase tracking-wider font-bold border-b border-gray-100 pb-2">Order Items</div>
                    {orderData.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start py-2">
                            <div>
                                <div className="font-medium text-gray-900">{item.shoe_name}</div>
                                <div className="text-xs text-gray-500">Size: {item.size} • {item.color}</div>
                                <div className="flex gap-1 flex-wrap mt-1">
                                    {item.services.map((s, i) => (
                                        <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0 h-5">{s.name}</Badge>
                                    ))}
                                    {item.add_ons.filter(a => a.isAutomatic).map((a, i) => (
                                        <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0 h-5 text-green-600 border-green-200">{a.name}</Badge>
                                    ))}
                                </div>
                            </div>
                            <div className="font-semibold text-gray-900">
                                {formatedCurrency(item.total_price)}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="border-t border-gray-100 pt-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-500">Subtotal</span>
                        <span className="font-medium">{formatedCurrency(orderData.total_price)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-dashed border-gray-200">
                        <span className="text-lg font-bold text-gray-900">Total Amount</span>
                        <span className="text-2xl font-bold text-blue-600">{formatedCurrency(orderData.total_price)}</span>
                    </div>
                </div>
            </div>
            
            {/* Ticket Bottom Decoration */}
            <div className="absolute bottom-0 left-0 w-full">
                <div className="h-4 bg-gray-50" style={{clipPath: 'polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)'}}></div>
            </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
            <Button 
                onClick={handleProceedToPayment}
                className="w-full h-14 text-lg rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
            >
                Proceed to Payment <ArrowLeft className="rotate-180 ml-2 h-5 w-5" />
            </Button>
            <Button 
                variant="ghost" 
                onClick={handleCancel}
                className="w-full text-gray-400 hover:text-red-500"
            >
                Cancel Order
            </Button>
        </div>

      </div>
    </div>
  );
}
