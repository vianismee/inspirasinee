// CatalogApp.tsx
"use client";
import { Suspense, useEffect, useState } from "react";
import TableSkeleton from "../Dashboard/TableSekeleton";
import { CatalogTable } from "./CatalogTable";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { PlusCircle, Trash2, Pencil, Save } from "lucide-react";
import ServiceForm from "./ServiceForm";
import { Input } from "../ui/input";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { useServiceCatalogStore } from "@/stores/serviceCatalogStore";

interface Service {
  id: number;
  name: string;
  amount: number;
  service_category: { id: number; name: string } | null;
}

export function CatalogApp() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(
    null
  );
  const [editingCategoryName, setEditingCategoryName] = useState<string>("");

  const {
    fetchCatalog,
    subscribeToChanges,
    serviceCategory,
    updateCategory,
    deleteCategory,
    totalCount,
  } = useServiceCatalogStore();

  useEffect(() => {
    fetchCatalog(); // Fetch initial page with default pagination
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
    fetchCatalog(); // fetch ulang untuk memperbarui daftar
    setNewCategoryName("");
  };

  const handleStartEditCategory = (category: { id: number; name: string }) => {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
  };

  const handleSaveCategory = async (categoryId: number) => {
    if (!editingCategoryName.trim()) {
      toast.error("Nama kategori tidak boleh kosong.");
      return;
    }
    await updateCategory(categoryId, editingCategoryName.trim());
    setEditingCategoryId(null);
    setEditingCategoryName("");
  };

  const handleDeleteCategory = (category: { id: number; name: string }) => {
    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus kategori "${category.name}"?`
      )
    ) {
      deleteCategory(category.id);
    }
  };

  const handleDialogChange = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingService(null);
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

        <div className="flex items-center flex-wrap gap-2 justify-center sm:justify-end">
          <Dialog open={isFormOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsFormOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Service
              </Button>
            </DialogTrigger>
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
            onOpenChange={(isOpen) => {
              setIsCategoryDialogOpen(isOpen);
              if (!isOpen) {
                setEditingCategoryId(null);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button variant={"outline"}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Manage Categories
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Manage Service Categories</DialogTitle>
              </DialogHeader>
              <div className="flex gap-3 pt-4">
                <Input
                  placeholder="e.g. Premium Wash"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleInsertCategory()}
                />
                <Button onClick={handleInsertCategory}>Add New</Button>
              </div>

              <div className="mt-6 space-y-3 max-h-60 overflow-y-auto pr-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Existing Categories
                </h4>
                {serviceCategory.length > 0 ? (
                  serviceCategory.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between gap-2 p-2 rounded-md bg-gray-50 dark:bg-gray-800"
                    >
                      {editingCategoryId === category.id ? (
                        <>
                          <Input
                            value={editingCategoryName}
                            onChange={(e) =>
                              setEditingCategoryName(e.target.value)
                            }
                            onKeyDown={(e) =>
                              e.key === "Enter" &&
                              handleSaveCategory(category.id)
                            }
                            className="h-9"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-green-600 hover:text-green-700"
                            onClick={() => handleSaveCategory(category.id)}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="text-sm">{category.name}</span>
                          <div className="flex items-center">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-blue-600 hover:text-blue-700"
                              onClick={() => handleStartEditCategory(category)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteCategory(category)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-center text-gray-500 py-4">
                    No categories found.
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <Suspense fallback={<TableSkeleton />}>
        <CatalogTable onEdit={handleEdit} />
      </Suspense>
    </div>
  );
}
