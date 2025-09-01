"use client";

import type { Column, ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Text } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import * as React from "react";

// Impor komponen UI yang diperlukan dari shadcn/ui
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { useDataTable } from "@/hooks/use-data-table";
import { useOrderStore } from "@/stores/orderStore";

interface Orders {
  customer_id: string;
  invoice_id: string;
  step: number;
  subtotal: number;
  discount_id?: string;
  total_price: number;
  payment: string;
  created_at: string;
}

export default function TableJob() {
  const [invoice_id] = useQueryState(
    "invoice_id",
    parseAsString.withDefault("")
  );

  const { fetchOrder, orders, subscribeToOrders } = useOrderStore();

  // Efek untuk memuat data awal dan berlangganan perubahan real-time
  React.useEffect(() => {
    fetchOrder(); // Memuat data saat komponen pertama kali dimuat

    const unsubscribe = subscribeToOrders(); // Memulai langganan real-time

    // Fungsi cleanup untuk berhenti berlangganan saat komponen dibongkar
    return () => {
      unsubscribe();
    };
  }, [fetchOrder, subscribeToOrders]);

  // Memo untuk memfilter data berdasarkan input pencarian
  const filteredData = React.useMemo(() => {
    return orders.filter((project) => {
      const matchesTitle =
        invoice_id === "" ||
        project.invoice_id.toLowerCase().includes(invoice_id.toLowerCase());
      return matchesTitle;
    });
  }, [invoice_id, orders]);

  // Memo untuk mendefinisikan kolom-kolom tabel
  const columns = React.useMemo<ColumnDef<Orders>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        size: 32,
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: "invoice_id",
        accessorKey: "invoice_id",
        header: ({ column }: { column: Column<Orders, unknown> }) => (
          <DataTableColumnHeader column={column} title="Invoice" />
        ),
        cell: ({ cell }) => <div>{cell.getValue<Orders["invoice_id"]>()}</div>,
        meta: {
          label: "Invoice ID",
          placeholder: "Search Invoice",
          variant: "text",
          icon: Text,
        },
        enableColumnFilter: true,
      },
      {
        id: "step",
        accessorKey: "step",
        header: "Status",
        cell: function Cell({ row }) {
          const statusOptions = [
            { value: 1, label: "Ongoing", variant: "outline" as const },
            { value: 2, label: "Pending", variant: "secondary" as const },
            { value: 3, label: "Cleaning", variant: "default" as const },
            {
              value: 4,
              label: "Finish",
              className:
                "border-transparent bg-green-500 text-primary-foreground shadow",
            },
          ];

          const currentStep = row.getValue<number>("step");
          const currentStatus = statusOptions.find(
            (status) => status.value === currentStep
          );
          const { updateOrderStep } = useOrderStore.getState();
          const invoiceId = row.original.invoice_id;

          if (!currentStatus) {
            return <span>-</span>;
          }

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-auto p-1 focus-visible:ring-0"
                >
                  <Badge
                    variant={currentStatus.variant}
                    className={currentStatus.className}
                  >
                    {currentStatus.label}
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ubah Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {statusOptions.map((status) => (
                  <DropdownMenuItem
                    key={status.value}
                    onSelect={() => updateOrderStep(invoiceId, status.value)}
                    disabled={currentStep === status.value}
                  >
                    {status.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
      {
        id: "actions",
        cell: function Cell() {
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Edit</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600 focus:text-red-600">
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
        size: 32,
      },
    ],
    []
  );

  const { table } = useDataTable({
    data: filteredData,
    columns,
    pageCount: 1, // Anda mungkin perlu menyesuaikan ini dengan paginasi server-side
    initialState: {
      sorting: [{ id: "created_at", desc: true }], // Mungkin lebih baik sort by created_at
      columnPinning: { right: ["actions"] },
    },
    getRowId: (row) => row.invoice_id,
  });

  return (
    <div className="data-table-container">
      <DataTable table={table}>
        <DataTableToolbar table={table} />
      </DataTable>
    </div>
  );
}
