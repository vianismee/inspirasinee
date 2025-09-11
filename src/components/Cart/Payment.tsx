import { useCartStore } from "@/stores/cartStore";
import { useCustomerStore } from "@/stores/customerStore";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Wallet2 } from "lucide-react";
import { formatedCurrency } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
// Impor fungsi yang sudah dipisahkan
import { generateReceiptText } from "@/lib/invoiceUtils";
import { IItems } from "@/types";

export function Payment() {
  const PAYMENT = [
    { label: "Pending", value: "Pending" },
    { label: "Cash", value: "Cash" },
    { label: "QRIS", value: "QRIS" },
  ];
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
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
  } = useCartStore();
  const { activeCustomer, clearCustomer } = useCustomerStore();

  // UBAH: Sesuaikan format data keranjang untuk struk WhatsApp
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
      })
    : "";

  const encode = encodeURIComponent(receiptText);
  const whatsappURL = `https://wa.me/${activeCustomer?.whatsapp}?text=${encode}`;

  const handleProcessPayment = async () => {
    setIsLoading(true);
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

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Payment</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader className="w-full flex items-center">
          <DialogTitle className="flex gap-2 items-center text-xl font-bold">
            <Wallet2 /> Payment
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 w-full">
          <h1 className="w-full text-center font-bold text-2xl">
            {formatedCurrency(totalPrice)}
          </h1>
          <div className="flex flex-col sm:flex-row w-full gap-3 pt-2">
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
                <Button onClick={handleClearData} variant="outline">
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
