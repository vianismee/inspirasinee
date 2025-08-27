import { SectionCards } from "@/components/section-cards";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Page() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards />
      <Link href={"https://wa.me/+62895605889773?text=Hey%ayuk"}>
        <Button>Ke Whatsapp</Button>
      </Link>
    </div>
  );
}
