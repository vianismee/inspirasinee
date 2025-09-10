// CatalogApp.tsx
"use client";
import { Suspense, useEffect, useState } from "react";
import TableSkeleton from "../Dashboard/TableSekeleton";
import { CatalogTable } from "./CatalogTable";
import { Button } from "../ui/button"; // Import komponen yang dibutuhkan
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { PlusCircle } from "lucide-react";
import ServiceForm from "./ServiceForm";
import { Input } from "../ui/input";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { useServiceCatalogStore } from "@/stores/serviceCatalogStore";

// Definisikan tipe Service di sini agar bisa digunakan
interface Service {
  id: number;
  name: string;
  amount: number;
  service_category: { id: number; name: string } | null;
}

export function CatalogApp() {
  // 1. Pindahkan semua state dan fungsi yang relevan ke sini
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const { fetchCatalog, subscribeToChanges } = useServiceCatalogStore();

  useEffect(() => {
    fetchCatalog();
    const unsubscribe = subscribeToChanges();
    return () => unsubscribe();
  }, [fetchCatalog, subscribeToChanges]);

  const handleInsertCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Nama kategori tidak boleh kosong.");
      return;
    }
    const supabase = createClient();
    const { error } = await supabase
      .from("service_category")
      .insert({ name: newCategoryName.trim() })
      .single();

    if (error) {
      toast.error(`Gagal menambah kategori: ${error.message}`);
      return;
    }
    toast.success(`Berhasil menambah kategori: ${newCategoryName}`);
    fetchCatalog();
    setNewCategoryName("");
    setIsCategoryDialogOpen(false);
  };

  const handleDialogChange = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingService(null); // Reset service yang diedit saat dialog ditutup
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setIsFormOpen(true);
  };

  return (
    <div className="w-full h-screen px-[30px] py-[30px]">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl text-center md:text-left sm:text-3xl font-bold text-gray-900 dark:text-white">
            Service Catalog
          </h1>
          <p className="text-gray-500 text-center md:text-left dark:text-gray-400 mt-1">
            Manage dan update harga Service Catalog.
          </p>
        </div>

        {/* 3. Pindahkan JSX Tombol dan Dialog ke sini */}
        <div className="flex items-center flex-wrap gap-2 justify-center sm:justify-end">
          <Dialog open={isFormOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsFormOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Service
              </Button>
            </DialogTrigger>
            {/* Konten dialog untuk Tambah/Edit Service */}
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingService ? "Edit Service" : "Tambah Service Baru"}
                </DialogTitle>
              </DialogHeader>
              <ServiceForm
                onFormSuccess={() => handleDialogChange(false)}
                initialData={editingService}
              />
            </DialogContent>
          </Dialog>

          <Dialog
            open={isCategoryDialogOpen}
            onOpenChange={setIsCategoryDialogOpen}
          >
            <DialogTrigger asChild>
              <Button variant={"outline"}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Service Category</DialogTitle>
              </DialogHeader>
              <div className="flex gap-3 py-4">
                <Input
                  placeholder="e.g. Premium Wash"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleInsertCategory()}
                />
                <Button onClick={handleInsertCategory}>Add</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <Suspense fallback={<TableSkeleton />}>
        {/* 4. Kirim fungsi handleEdit sebagai props ke CatalogTable */}
        <CatalogTable onEdit={handleEdit} />
      </Suspense>
    </div>
  );
}
