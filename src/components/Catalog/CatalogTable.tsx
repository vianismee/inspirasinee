"use client";

import { useServiceCatalogStore, Category } from "@/stores/serviceCatalogStore";
import React, { useState, useEffect, useMemo } from "react";
import { DataTable } from "../data-table/data-table";
import { DataTableToolbar } from "../data-table/data-table-toolbar";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";
import { ColumnDef } from "@tanstack/react-table";
import { useDataTable } from "@/hooks/use-data-table";
import { formatedCurrency } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { MoreHorizontal, PlusCircle, Trash2, Pencil } from "lucide-react";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import ServiceForm from "./ServiceForm";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { Input } from "../ui/input";

interface Service {
  id: number;
  name: string;
  amount: number;
  service_category: Category | null;
}

export function CatalogTable() {
  const [isMounted, setIsMounted] = useState(false);

  // State untuk filter dari URL
  const [name] = useQueryState("name", parseAsString.withDefault(""));
  const [category] = useQueryState(
    "category",
    parseAsArrayOf(parseAsString).withDefault([])
  );

  // State untuk dialog form "Add/Edit Service"
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // State untuk dialog "Add Category"
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const {
    fetchCatalog,
    serviceCatalog,
    serviceCategory,
    subscribeToChanges,
    deleteService,
  } = useServiceCatalogStore();

  // Efek untuk fetch data dan subscribe (hanya berjalan sekali)
  useEffect(() => {
    fetchCatalog();
    const unsubscribe = subscribeToChanges();
    return () => unsubscribe();
  }, [fetchCatalog, subscribeToChanges]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Logika filter client-side
  const filteredService = useMemo(() => {
    return serviceCatalog.filter((service) => {
      const matchesName =
        name === "" || service.name.toLowerCase().includes(name.toLowerCase());
      const matchesCategory =
        category.length === 0 ||
        (service.service_category &&
          category.includes(service.service_category.name));
      return matchesName && matchesCategory;
    });
  }, [serviceCatalog, name, category]);

  // Fungsi untuk menambah kategori baru
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
    setNewCategoryName("");
    setIsCategoryDialogOpen(false);
  };

  // Definisi kolom untuk tabel
  const columns = useMemo<ColumnDef<Service>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: "Service",
        meta: {
          label: "Nama Service",
          placeholder: "Cari nama service...",
          variant: "text",
        },
        enableColumnFilter: true,
      },
      {
        id: "category",
        header: "Category",
        accessorFn: (row) => row.service_category?.name,
        cell: ({ row }) => {
          const categoryName = row.original.service_category?.name;
          return categoryName ? (
            <Badge variant="outline">{categoryName}</Badge>
          ) : (
            <span>-</span>
          );
        },
        meta: {
          label: "Kategori",
          variant: "multiSelect",
          options: serviceCategory.map((cat) => ({
            label: cat.name,
            value: cat.name,
          })),
        },
        enableColumnFilter: true,
      },
      {
        id: "amount",
        accessorKey: "amount",
        header: () => <div className="text-right">Harga</div>,
        cell: ({ row }) => (
          <div className="text-right">
            {formatedCurrency(row.getValue("amount"))}
          </div>
        ),
      },
      {
        id: "actions",
        cell: function Cell({ row }) {
          const service = row.original;
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant={"ghost"} size={"icon"} className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open Menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="flex items-center gap-2"
                    onSelect={() => {
                      setEditingService(service);
                      setIsFormOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center gap-2 text-red-600 focus:text-red-600 focus:bg-red-50"
                    onSelect={() => deleteService(service.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        size: 32,
      },
    ],
    [deleteService, serviceCategory]
  );

  const { table } = useDataTable({
    data: filteredService,
    columns,
    pageCount: -1,
    initialState: { columnPinning: { right: ["actions"] } },
    getRowId: (row) => String(row.id),
  });

  // Handler untuk menutup dialog dan mereset state
  const handleDialogChange = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingService(null);
    }
  };

  // Mencegah render di server
  if (!isMounted) {
    return null; // Atau tampilkan skeleton loader
  }

  return (
    <div className="w-full space-y-4">
      <DataTable table={table}>
        <DataTableToolbar table={table}>
          {/* Dialog dan Trigger untuk Tambah/Edit Service */}
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
                onFormSuccess={() => setIsFormOpen(false)}
                initialData={editingService}
              />
            </DialogContent>
          </Dialog>

          {/* Dialog dan Trigger untuk Tambah Kategori */}
          <Dialog
            open={isCategoryDialogOpen}
            onOpenChange={setIsCategoryDialogOpen}
          >
            <DialogTrigger asChild>
              <Button variant={"outline"} className="ml-2">
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
        </DataTableToolbar>
      </DataTable>
    </div>
  );
}
