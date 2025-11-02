// src/components/Customer/CustomerTable.tsx
"use client";

import React, { useMemo, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Trash2, Pencil, Send } from "lucide-react";

import { useDataTable } from "@/hooks/use-data-table";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { useQueryState, parseAsInteger } from "nuqs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useCustomerStore } from "@/stores/customerStore";
import { ICustomers } from "@/types";
import { Badge } from "../ui/badge";
import { generateChatCustomer } from "@/lib/invoiceUtils";

interface CustomerTableProps {
  onEdit: (customer: ICustomers) => void;
  onView: (customer: ICustomers) => void; // <-- Prop baru untuk melihat detail
}

export function CustomerTable({ onEdit, onView }: CustomerTableProps) {
  const {
    customers,
    fetchCustomers,
    deleteCustomer,
    subscribeToCustomerChanges,
    totalCount,
  } = useCustomerStore();

  // Get pagination state from URL
  const [page] = useQueryState("page", parseAsInteger.withDefault(1));
  const [perPage] = useQueryState("perPage", parseAsInteger.withDefault(10));

  useEffect(() => {
    fetchCustomers({ page, pageSize: perPage });
    const unsubscribe = subscribeToCustomerChanges();
    return () => unsubscribe();
  }, [fetchCustomers, subscribeToCustomerChanges, page, perPage]);

  const handleSendMessage = (customer: ICustomers) => {
    const message = generateChatCustomer(customer);
    const whatsappUrl = `https://wa.me/${
      customer.whatsapp
    }?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const columns = useMemo<ColumnDef<ICustomers>[]>(
    () => [
      {
        accessorKey: "customer_id",
        header: "ID",
      },
      {
        accessorKey: "username",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Nama" />
        ),
        cell: ({ row }) => (
          <Button
            variant="link"
            className="p-0 h-auto font-semibold"
            onClick={() => onView(row.original)}
          >
            {row.original.username}
          </Button>
        ),
        meta: {
          label: "Nama",
          placeholder: "Cari nama...",
          variant: "text",
        },
        enableColumnFilter: true,
      },
      {
        accessorKey: "orders",
        header: "Total Pesanan",
        cell: ({ row }) => {
          const totalOrder = row.original.orders?.length || 0;
          return <div>{totalOrder}</div>;
        },
      },
      {
        accessorKey: "alamat",
        header: "Alamat",
        cell: ({ row }) => {
          const alamat = row.getValue("alamat");
          return alamat ? (
            <span className="truncate">{String(alamat)}</span>
          ) : (
            <Badge variant="outline">Tidak ada alamat</Badge>
          );
        },
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const customer = row.original;
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
                  <DropdownMenuItem onClick={() => handleSendMessage(customer)}>
                    <Send className="mr-2 h-4 w-4" /> Message
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(customer)}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                    onClick={() => deleteCustomer(customer.customer_id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Hapus
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [deleteCustomer, onEdit, onView]
  );

  // Calculate page count based on total count and page size
  const pageCount = Math.ceil(totalCount / perPage);

  const { table } = useDataTable({
    data: customers,
    columns,
    pageCount,
    initialState: {
      sorting: [{ id: "username", desc: false }],
      pagination: {
        pageSize: perPage,
        pageIndex: page - 1, // zero-based index
      },
    },
  });

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}
