import { useCartStore } from "@/stores/cartStore";
import { useCustomerStore } from "@/stores/customerStore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Wallet2 } from "lucide-react";
import { formatedCurrency } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { generateReceiptText } from "@/lib/invoiceUtils";
import { IItems } from "@/types";
import { useRouter } from "next/navigation"; // 1. Impor useRouter
import { Separator } from "@/components/ui/separator";

export function Payment() {
  const PAYMENT = [
    { label: "Pending", value: "Pending" },
    { label: "Cash", value: "Cash" },
    { label: "QRIS", value: "QRIS" },
  ];
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter(); // 2. Inisialisasi router

  const {
    totalPrice,
    setPayment,
    handleSubmit,
    resetCart,
    cart,
    payment,
    invoice,
    subTotal,
    activeDiscounts,
    referralCode,
    referralDiscount,
    pointsUsed,
    pointsDiscount,
  } = useCartStore();
  const { activeCustomer, clearCustomer } = useCustomerStore();

  const formattedCart: IItems[] = cart.flatMap((item) =>
    item.services.map((service) => ({
      shoe_name: item.shoeName,
      service: service.name,
      amount: String(service.amount),
    }))
  );

  const formattedDiscounts = activeDiscounts.map((discount) => {
    const amount = discount.percent
      ? Math.round(subTotal * discount.percent)
      : discount.amount || 0;
    return {
      label: discount.label,
      amount: amount,
    };
  });

  const receiptText = activeCustomer
    ? generateReceiptText({
        customer: activeCustomer,
        invoice,
        cart: formattedCart,
        subTotal,
        totalPrice,
        payment,
        discounts: formattedDiscounts,
        referralCode: referralCode || undefined,
        referralDiscount: referralDiscount || undefined,
        pointsUsed: pointsUsed || undefined,
        pointsDiscount: pointsDiscount || undefined,
      })
    : "";

  const encode = encodeURIComponent(receiptText);
  const whatsappURL = `https://wa.me/${activeCustomer?.whatsapp}?text=${encode}`;

  const handleProcessPayment = async () => {
    setIsLoading(true);

    // 3. Tambahkan logika untuk QRIS
    if (payment === "QRIS") {
      if (totalPrice <= 0) {
        toast.error("Tidak ada total tagihan untuk dibayar.");
        setIsLoading(false);
        return;
      }
      // Arahkan ke halaman qris, data totalPrice sudah ada di cartStore
      router.push("/admin/order/service/qris");
      return; // Hentikan eksekusi di sini agar tidak lanjut ke handleSubmit
    }

    // Logika ini hanya berjalan jika pembayaran BUKAN QRIS
    const success = await handleSubmit();
    setIsLoading(false);

    if (success) {
      toast.success("Transaksi Berhasil! Silahkan kirim invoice ke Customer");
      setIsSuccess(true);
    }
  };

  const handleClearData = () => {
    clearCustomer();
    resetCart();
    setIsSuccess(false);
  };

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const handleDialogStateChange = (open: boolean) => {
    if (!open && isSuccess) {
      handleClearData();
    }
    setIsDialogOpen(open);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleDialogStateChange}>
      <DialogTrigger asChild>
        <Button onClick={() => setIsDialogOpen(true)}>Payment</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader className="w-full flex items-center">
          <DialogTitle className="flex gap-2 items-center text-xl font-bold">
            {isSuccess ? (
              <>
                <Wallet2 /> Transaksi Berhasil!
              </>
            ) : (
              <>
                <Wallet2 /> Payment
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 w-full">
          {!isSuccess ? (
            <>
              <h1 className="w-full text-center font-bold text-2xl">
                {formatedCurrency(totalPrice)}
              </h1>
              <div className="flex flex-col w-full gap-3 pt-2">
                {PAYMENT.map((paymentItem) => (
                  <Button
                    key={paymentItem.value}
                    variant={payment === paymentItem.value ? "default" : "outline"}
                    onClick={() => setPayment(paymentItem.value)}
                    className="w-full justify-start py-6 text-md font-medium"
                  >
                    {paymentItem.label}
                  </Button>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Success Summary */}
              <div className="text-center space-y-2">
                <div className="text-green-600 font-semibold">
                  ✅ Invoice #{invoice}
                </div>
                <div className="text-sm text-muted-foreground">
                  Metode Pembayaran: {payment}
                </div>
              </div>

              <Separator />

              {/* Order Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatedCurrency(subTotal)}</span>
                </div>

                {/* Regular Discounts */}
                {activeDiscounts.map((discount, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Diskon - {discount.label}
                    </span>
                    <span className="text-green-600">
                      -{formatedCurrency(
                        discount.percent
                          ? Math.round(subTotal * discount.percent)
                          : discount.amount || 0
                      )}
                    </span>
                  </div>
                ))}

                {/* Referral Discount */}
                {referralCode && referralDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      💰 Referral - {referralCode}
                    </span>
                    <span className="text-green-600">
                      -{formatedCurrency(referralDiscount)}
                    </span>
                  </div>
                )}

                {/* Points Redemption */}
                {pointsUsed > 0 && pointsDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      🎯 Poin ({pointsUsed} poin)
                    </span>
                    <span className="text-green-600">
                      -{formatedCurrency(pointsDiscount)}
                    </span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-lg">{formatedCurrency(totalPrice)}</span>
                </div>
              </div>

              <Separator />

              <div className="text-center text-sm text-muted-foreground">
                {activeCustomer && (
                  <div>
                    <div className="font-medium">{activeCustomer.username}</div>
                    <div>{activeCustomer.customer_id}</div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          {!isSuccess ? (
            <>
              <DialogClose asChild>
                <Button variant="outline">Batal</Button>
              </DialogClose>
              <Button onClick={handleProcessPayment} disabled={isLoading}>
                {isLoading ? "Memproses..." : "Proses"}
              </Button>
            </>
          ) : (
            <div className="w-full flex flex-col sm:flex-row gap-2">
              <a
                href={whatsappURL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button className="bg-green-500 hover:bg-green-600 w-full">
                  Kirim Invoice
                </Button>
              </a>
              <DialogClose asChild>
                <Button
                  onClick={handleClearData}
                  variant="outline"
                  className="w-full"
                >
                  Transaksi Baru
                </Button>
              </DialogClose>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
