import { PlusCircle } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

export function AddCatalog() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [category, setCategory] = useState<string>("");
  const handleInsertCategory = async () => {
    const supabase = createClient();
    const { error } = await supabase
      .from("service_category")
      .insert({ name: category })
      .single();
    if (error) {
      throw error;
    }
    toast.success(`Berhasil Menambah Category ${category}`);
    setCategory("");
    setIsOpen(!isOpen);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger>
        <Button variant={"outline"}>
          <PlusCircle /> Add Category
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Service Category</DialogTitle>
        </DialogHeader>
        <div className="flex gap-5">
          <Input
            className="border-zinc-300 placeholder:text-black/50"
            placeholder="e.g. Sneakers Treatment"
            onChange={(e) => setCategory(e.target.value)}
          />
          <Button onClick={handleInsertCategory}>
            <PlusCircle /> Add
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
