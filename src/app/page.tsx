import { useInviceID } from "@/hooks/useInvoiceID";
import { InvoiceQRCode } from "./../components/invoiceQRCode";

export default function Home() {
  const { invoiceId } = useInviceID();
  return (
    <div className="p-12">
      <div className="flex flex-col gap-2">
        <h1>Your Invoice = {invoiceId}</h1>
        <h1>Your QR Code</h1>
        <InvoiceQRCode invoiceId={invoiceId} />
      </div>
    </div>
  );
}
