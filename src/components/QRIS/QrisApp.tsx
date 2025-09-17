"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { useCartStore } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { formatedCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { useCustomerStore } from "@/stores/customerStore";
import { generateQRIS } from "@/lib/QRISUtils";
import Image from "next/image";

export default function QrisPaymentPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Ambil data yang relevan dari Zustand store
  const { totalPrice, invoice, handleSubmit, resetCart } = useCartStore();
  const { clearCustomer } = useCustomerStore();

  useEffect(() => {
    const staticQrisCode = process.env.NEXT_PUBLIC_STATIC_QRIS_CODE;

    if (!totalPrice || !staticQrisCode || !canvasRef.current) {
      toast.error("Sesi Telah Berakhir");
      router.replace("/admin/order/");
      return;
    }

    try {
      const dynamicQrisData = generateQRIS(staticQrisCode, totalPrice);
      QRCode.toCanvas(canvasRef.current, dynamicQrisData, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: "H",
      });
    } catch (error) {
      console.error("Gagal membuat QR Code:", error);
      toast.error("Gagal membuat QR Code.");
    }
  }, [totalPrice, router]);

  const downloadQR = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `QRIS-PAYMENT-${invoice}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };
  const handleConfirmPayment = async () => {
    toast.info("Memproses pembayaran...");
    const success = await handleSubmit();
    if (success) {
      toast.success("Pembayaran Berhasil! Transaksi disimpan.");
      resetCart();
      clearCustomer();
      router.replace("/admin/order/");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-100">
      <div className="w-full max-w-md mx-auto bg-white rounded-lg p-8 shadow-lg text-center">
        <Image
          src={"/qris-logo.png"}
          width={100}
          height={40}
          alt={"Logo QRIS"}
          className="mx-auto mb-4"
        />
        <h1 className="text-2xl font-bold mb-2">Scan QRIS</h1>
        <p className="text-gray-600 mb-4">Invoice ID: {invoice}</p>

        <div className="mb-4">
          <p className="text-lg">Total Tagihan:</p>
          <p className="text-3xl font-bold text-blue-600 font-mono">
            {formatedCurrency(totalPrice)}
          </p>
        </div>

        <div className="mb-6 flex justify-center">
          <canvas ref={canvasRef} className="border border-gray-200 rounded" />
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleConfirmPayment}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Proses Order
          </Button>
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="w-full"
          >
            Kembali
          </Button>
        </div>
      </div>
    </div>
  );
}
