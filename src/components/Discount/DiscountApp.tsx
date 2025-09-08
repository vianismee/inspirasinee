import { PlusCircle } from "lucide-react";
import { Headers } from "../MainComponent/Header";

export function DiscountApp() {
  return (
    <div className="w-full  h-screen px-[30px] py-[30px]">
      <div className="flex flex-col">
        <Headers
          title="Discount"
          desc="Manage Discount"
          buttonTitle="Tambah Discount"
          icon={PlusCircle}
        />
      </div>
    </div>
  );
}
