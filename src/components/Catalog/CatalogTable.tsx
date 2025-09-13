"use client";

import { useServiceCatalogStore, Category } from "@/stores/serviceCatalogStore";
import React, { useMemo } from "react";
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
import { MoreHorizontal, Trash2, Pencil } from "lucide-react";
import { Badge } from "../ui/badge";

// Tipe untuk data service
interface Service {
  id: number;
  name: string;
  amount: number;
  service_category: Category | null;
}

// Tipe untuk props yang diterima dari komponen induk (CatalogApp)
interface CatalogTableProps {
  onEdit: (service: Service) => void;
}

export function CatalogTable({ onEdit }: CatalogTableProps) {
  // State untuk filtering, dikontrol oleh URL query
  const [name] = useQueryState("name", parseAsString.withDefault(""));
  const [category] = useQueryState(
    "category",
    parseAsArrayOf(parseAsString).withDefault([])
  );

  // Mengambil data dan fungsi dari Zustand store
  const { serviceCatalog, serviceCategory, deleteService } =
    useServiceCatalogStore();

  // Filter data service berdasarkan query dari URL
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

  // Definisi kolom untuk data table
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
                    onSelect={() => onEdit(service)} // Memanggil fungsi onEdit dari props
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center gap-2 text-red-600 focus:text-red-600 focus:bg-red-50"
                    onSelect={() => deleteService(service.id)} // Memanggil fungsi delete dari store
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
    [deleteService, serviceCategory, onEdit] // Menambahkan onEdit sebagai dependency
  );

  // Inisialisasi table menggunakan custom hook
  const { table } = useDataTable({
    data: filteredService,
    columns,
    pageCount: -1, // Diasumsikan tidak ada pagination sisi client
    initialState: { columnPinning: { right: ["actions"] } },
    getRowId: (row) => String(row.id),
  });

  return (
    <div className="w-full space-y-4">
      <DataTable table={table}>
        <DataTableToolbar table={table} />
      </DataTable>
    </div>
  );
}
