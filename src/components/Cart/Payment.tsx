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
import { useRouter } from "next/navigation";
import Link from "next/link";

export function Payment() {
  const PAYMENT = [
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
    newPayment,
    handleSubmit,
    resetCart,
    cart,
    payment,
    invoice,
    subTotal,
    activeDiscount,
  } = useCartStore();
  const { activeCustomer } = useCustomerStore();
  const router = useRouter();

  let receiptText = `Hallo kak *${activeCustomer?.username}*\n\n`;
  receiptText += `Berikut Invoice Order\n\n`;
  receiptText += `Invoice No. *${invoice}*\n`;
  receiptText += `Tanggal:  **\n`;
  receiptText += `-----------------------------------\n\n`;
  receiptText += `*Detail Service:*\n`;
  cart.forEach((text) => {
    receiptText += `*${text.shoeName}\n*`;
    receiptText += `${text.serviceName.toUpperCase} - ${formatedCurrency(
      text.amount
    )}\n`;
  });

  receiptText += `\n-----------------------------------\n`;
  receiptText += `Subtotal: ${formatedCurrency(subTotal)} \n`;
  receiptText += `Discount: -${formatedCurrency(
    activeDiscount?.amount || 0
  )} \n`;
  receiptText += `*Total Pembayaran: ${formatedCurrency(totalPrice)}*\n`;
  receiptText += `*Metode Pembayaran: ${payment}*\n\n`;
  receiptText += `Terimakasih atas Kepercayaannya`;

  const encode = encodeURIComponent(receiptText);
  const whatsappURL = `https://wa.me/${activeCustomer?.whatsapp}&text=${encode}`;

  const handleProcessPayment = async () => {
    setIsLoading(true);
    const success = await handleSubmit();
    setIsLoading(false);

    if (success) {
      toast.success("Transaksi Berhasil! Silahkan kirim invoice ke Customer");
      setIsSuccess(true);
    }
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
            onValueChange={(value) => newPayment(value)}
          >
            {PAYMENT.map((payment, index) => (
              <Label
                key={index}
                htmlFor={`payment-${payment.value}`}
                className="flex gap-2 items-center w-full py-3 pl-4 border-2 border-zinc-300 rounded-md cursor-pointer
               peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-blue-200
               transition-all"
              >
                <RadioGroupItem
                  value={payment.value}
                  id={`payment-${payment.value}`}
                  className="peer sr-only" // Sembunyikan radio button asli
                />
                <div
                  className="flex h-5 w-5 items-center justify-center rounded-full border border-zinc-400
                  peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-500"
                >
                  <div className="h-2 w-2 rounded-full bg-white"></div>
                </div>
                <span className="text-md font-bold">{payment.label}</span>
              </Label>
            ))}

            {/* Opsi 2: QRIS */}
          </RadioGroup>
        </div>
        <DialogFooter>
          <a href={whatsappURL}>
            <Button
              disabled={!isSuccess}
              className="bg-green-500 disabled:bg-green-300"
            >
              Kirim Invoice
            </Button>
          </a>
          <Button variant="outline">Batal</Button>
          <Button onClick={handleProcessPayment} disabled={isLoading}>
            Proses
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
