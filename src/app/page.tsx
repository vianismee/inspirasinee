import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="p-12">
      <div className="flex flex-col gap-2">
        <Link href={"/admin/input"}>
          <Button>Add Transaction</Button>
        </Link>
      </div>
    </div>
  );
}
