import { CartApp } from "@/components/Cart/CartApp";
import { useInviceID } from "@/hooks/useInvoiceID";
export default function ServicePage() {
  const { invoiceId } = useInviceID();
  return (
    <div>
      <CartApp invoiceId={invoiceId} />
    </div>
  );
}
