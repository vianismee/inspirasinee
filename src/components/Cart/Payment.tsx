import { useCartStore } from "@/stores/cartStore";
import { useCustomerStore } from "@/stores/customerStore";
import { Button } from "../ui/button";

export function Payment() {
  const { activeCustomer } = useCustomerStore();
  const { cart, activeDiscount, invoice } = useCartStore();
  const step = 1;

  const handleApply = () => {
    console.log(activeCustomer);
    const finalData = {
      invoice_id: invoice,
      step: step,
      services: cart,
      discount: activeDiscount,
    };

    console.log(finalData);
  };

  return <Button onClick={handleApply}> Payment</Button>;
}
