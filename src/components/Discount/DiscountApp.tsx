import { PlusCircle } from "lucide-react";
import { Headers } from "../MainComponent/Header";

export function DiscountApp() {
  return (
    <div className="flex flex-col">
      <Headers
        title="Discount"
        desc="Manage Discount"
        buttonTitle="Tambah Discount"
        icon={PlusCircle}
      />
    </div>
  );
}
