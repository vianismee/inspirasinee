import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AdminPage() {
  return (
    <main className="flex p-12">
      <Link href={"/admin/input"}>
        <Button>Add Transaction</Button>
      </Link>
    </main>
  );
}
