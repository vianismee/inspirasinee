"use client";
import { useServiceCatalogStore, Category } from "@/stores/serviceCatalogStore";
import React from "react";
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
// Impor DataTablePagination karena tabel ini menggunakan client-side pagination
import { DataTablePagination } from "../data-table/data-table-pagination";

// Interface untuk data Service
interface Service {
  id: number;
  name: string;
  amount: number;
  service_category: Category | null;
}

export function CatalogTable() {
  // State untuk filter dari URL
  const [name] = useQueryState("name", parseAsString.withDefault(""));
  const [category] = useQueryState(
    "category",
    parseAsArrayOf(parseAsString).withDefault([])
  );
  // State untuk mengontrol dialog form
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  // State untuk menyimpan data service yang akan diedit
  const [editingService, setEditingService] = React.useState<Service | null>(
    null
  );

  const {
    fetchCatalog,
    serviceCatalog,
    serviceCategory,
    subscribeToChanges,
    deleteService,
  } = useServiceCatalogStore();

  React.useEffect(() => {
    fetchCatalog();
    const unsubscribe = subscribeToChanges();
    return () => unsubscribe();
  }, [fetchCatalog, subscribeToChanges]);

  // Logika filter client-side untuk nama dan kategori
  const filteredService = React.useMemo(() => {
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

  const columns = React.useMemo<ColumnDef<Service>[]>(
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
        header: "Harga",
        cell: ({ row }) => (
          <div>{formatedCurrency(row.getValue("amount"))}</div>
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
    pageCount: -1, // -1 untuk client-side pagination internal
    initialState: {
      columnPinning: { right: ["actions"] },
    },
    getRowId: (row) => String(row.id),
  });

  // Fungsi untuk menangani penutupan dialog
  const handleDialogChange = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingService(null);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Struktur baru sesuai permintaan */}
      <DataTable table={table}>
        <DataTableToolbar table={table}>
          {/* Dialog dan Trigger sekarang berada di dalam Toolbar */}
          <Dialog open={isFormOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingService(null); // Pastikan mode tambah
                  setIsFormOpen(true);
                }}
              >
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
        </DataTableToolbar>
      </DataTable>
    </div>
  );
}
