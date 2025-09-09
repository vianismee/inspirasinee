// components/discount/DiscountTable.tsx

"use client";

import { useServiceCatalogStore, Discount } from "@/stores/serviceCatalogStore";
import React, { useState, useEffect, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, PlusCircle, Trash2 } from "lucide-react";
import { formatedCurrency } from "@/lib/utils";

import { useDataTable } from "@/hooks/use-data-table";
import { DataTable } from "../data-table/data-table";
import { DataTableToolbar } from "../data-table/data-table-toolbar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import DiscountForm from "./DiscountForm";

export function DiscountTable() {
  const [isMounted, setIsMounted] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);

  const { discountOptions, fetchCatalog, subscribeToChanges, deleteDiscount } =
    useServiceCatalogStore();

  useEffect(() => {
    fetchCatalog();
    const unsubscribe = subscribeToChanges();
    return () => unsubscribe();
  }, [fetchCatalog, subscribeToChanges]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleDialogChange = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingDiscount(null);
    }
  };

  const columns = useMemo<ColumnDef<Discount>[]>(
    () => [
      {
        accessorKey: "label",
        header: "Label",
        meta: {
          label: "Label Diskon",
          placeholder: "Cari berdasarkan label...",
          variant: "text",
        },
        enableColumnFilter: true,
      },
      {
        id: "value",
        header: "Nominal",
        cell: ({ row }) => {
          const { amount, percent } = row.original;
          if (amount) {
            return <span>{formatedCurrency(amount)}</span>;
          }
          if (percent) {
            return <span>{`${(percent * 100).toFixed()}%`}</span>;
          }
          return <span>-</span>;
        },
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const discount = row.original;
          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Buka menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Action</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => {
                      setEditingDiscount(discount);
                      setIsFormOpen(true);
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => deleteDiscount(discount.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [deleteDiscount]
  );

  const { table } = useDataTable({
    data: discountOptions,
    columns,
    pageCount: -1,
  });

  if (!isMounted) {
    return null; // atau skeleton loader
  }

  return (
    <Dialog open={isFormOpen} onOpenChange={handleDialogChange}>
      <DataTable table={table}>
        <DataTableToolbar table={table}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsFormOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Discount
            </Button>
          </DialogTrigger>
        </DataTableToolbar>
      </DataTable>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {editingDiscount ? "Edit Diskon" : "Tambah Diskon Baru"}
          </DialogTitle>
        </DialogHeader>
        <DiscountForm
          onFormSuccess={() => setIsFormOpen(false)}
          initialData={editingDiscount}
        />
      </DialogContent>
    </Dialog>
  );
}
