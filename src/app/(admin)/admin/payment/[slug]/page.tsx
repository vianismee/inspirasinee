"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import QRCode from "qrcode";
import { useOrderStore } from "@/stores/orderStore";
import { Button } from "@/components/ui/button";
import { formatedCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { generateQRIS } from "@/lib/QRISUtils";
import Image from "next/image";

// Komponen untuk loading state
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center gap-4">
    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    <p className="text-gray-600">Memuat data order...</p>
  </div>
);

export default function InvoicePaymentPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string; // Ambil invoice_id dari URL

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Gunakan orderStore untuk mengambil data order yang sudah ada
  const { singleOrders, fetchOrder, isLoading, updatePayment } =
    useOrderStore();
  const [isProcessing, setIsProcessing] = useState(false);

  // Ambil data order spesifik berdasarkan slug saat komponen dimuat
  useEffect(() => {
    if (slug) {
      fetchOrder({ invoice: slug });
    }
  }, [slug, fetchOrder]);

  // Generate QR code SETELAH data order berhasil dimuat
  useEffect(() => {
    const staticQrisCode = process.env.NEXT_PUBLIC_STATIC_QRIS_CODE;

    // Gunakan singleOrders (dari orderStore), bukan totalPrice (dari cartStore)
    if (singleOrders && staticQrisCode && canvasRef.current) {
      // Validasi tambahan: jika order sudah lunas, jangan tampilkan QR
      if (singleOrders.payment !== "Pending") {
        toast.info("Invoice ini sudah lunas.");
        router.replace("/admin");
        return;
      }

      try {
        const dynamicQrisData = generateQRIS(
          staticQrisCode,
          singleOrders.total_price
        );
        QRCode.toCanvas(canvasRef.current, dynamicQrisData, {
          width: 300,
          margin: 2,
          errorCorrectionLevel: "H",
        });
      } catch (error) {
        console.log(error);
        toast.error("Gagal membuat QR Code.");
      }
    }
  }, [singleOrders, router]); // Dependency diubah ke singleOrders

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    // Update pembayaran menjadi 'QRIS'
    await updatePayment(slug, "QRIS");
    setIsProcessing(false);
    router.push("/admin"); // Kembali ke tabel setelah pembayaran berhasil
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-100 p-4">
      <div className="w-full max-w-md mx-auto bg-white rounded-lg p-8 shadow-lg text-center">
        {isLoading && <LoadingSpinner />}

        {!isLoading && !singleOrders && (
          <p className="text-red-500">Invoice tidak ditemukan.</p>
        )}

        {!isLoading && singleOrders && (
          <>
            <Image
              src={"/qris-logo.png"}
              width={100}
              height={40}
              alt={"Logo QRIS"}
              className="mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold mb-2">Scan QRIS</h1>
            <p className="text-gray-600 mb-4">
              Invoice ID: {singleOrders.invoice_id}
            </p>

            <div className="mb-4">
              <p className="text-lg">Total Tagihan:</p>
              <p className="text-3xl font-bold text-blue-600 font-mono">
                {formatedCurrency(singleOrders.total_price)}
              </p>
            </div>

            <div className="mb-6 flex justify-center">
              <canvas
                ref={canvasRef}
                className="border border-gray-200 rounded"
              />
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleConfirmPayment}
                disabled={isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? "Memproses..." : "Tandai Sudah Bayar (QRIS)"}
              </Button>
              <Button
                onClick={() => router.push("/admin")}
                variant="outline"
                className="w-full"
              >
                Kembali
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
