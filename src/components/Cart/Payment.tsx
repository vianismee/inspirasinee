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
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import { formatedCurrency } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

export function Payment() {
  const PAYMENT = [
    {
      label: "Pending",
      value: "Pending",
    },
    {
      label: "Cash",
      value: "Cash",
    },
    {
      label: "QRIS",
      value: "QRIS",
    },
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

  let receiptText = `Hallo kak *${activeCustomer?.username}*\n\n`;
  receiptText += `Berikut Invoice Order\n\n`;
  receiptText += `Invoice No. *${invoice}*\n`;
  receiptText += `Tanggal: ${new Date().toLocaleDateString("id-ID")}\n`;
  receiptText += `-----------------------------------\n\n`;
  receiptText += `*Detail Service:*\n\n`;
  cart.forEach((text) => {
    receiptText += `*${text.shoeName}*\n`;
    receiptText += `${text.serviceName} - ${formatedCurrency(text.amount)}\n\n`;
  });

  receiptText += `\n-----------------------------------\n`;
  receiptText += `Subtotal: ${formatedCurrency(subTotal)} \n`;
  if (activeDiscounts.length > 0) {
    receiptText += `Diskon:\n`;
    activeDiscounts.forEach((discount) => {
      const discountValue = discount.percent
        ? subTotal * discount.percent
        : discount.amount || 0;
      receiptText += `- ${discount.label}: -${formatedCurrency(
        discountValue
      )}\n`;
    });
  }
  receiptText += `*Total Pembayaran: ${formatedCurrency(totalPrice)}*\n`;
  receiptText += `Metode Pembayaran: ${payment}\n\n`;
  receiptText += `\n-----------------------------------\n\n`;
  receiptText += `Tracking Order kamu di: \n`;
  receiptText += `https://inspirasinee.vercel.app/tracking/${invoice}\n`;
  receiptText += `Terimakasih atas Kepercayaannya`;

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
          <RadioGroup
            className="flex w-full gap-4"
            onValueChange={(value) => setPayment(value)}
            defaultValue={payment}
          >
            {PAYMENT.map((paymentItem, index) => (
              <Label
                key={index}
                htmlFor={`payment-${paymentItem.value}`}
                className="flex gap-2 items-center w-full py-3 pl-4 border-2 border-zinc-300 rounded-md cursor-pointer
                peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-blue-200
                transition-all"
              >
                <RadioGroupItem
                  value={paymentItem.value}
                  id={`payment-${paymentItem.value}`}
                  className="peer sr-only"
                />
                <div
                  className="flex h-5 w-5 items-center justify-center rounded-full border border-zinc-400
                  peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-500"
                >
                  <div className="h-2 w-2 rounded-full bg-white"></div>
                </div>
                <span className="text-md font-bold">{paymentItem.label}</span>
              </Label>
            ))}
          </RadioGroup>
        </div>
        <DialogFooter>
          {!isSuccess ? (
            <>
              <DialogClose asChild>
                <Button variant="outline">Batal</Button>
              </DialogClose>
              <Button onClick={handleProcessPayment} disabled={isLoading}>
                Proses
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
