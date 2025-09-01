"use client";

import type { Column, ColumnDef } from "@tanstack/react-table";
import {
  CheckCircle,
  CheckCircle2,
  DollarSign,
  MoreHorizontal,
  Text,
  XCircle,
} from "lucide-react";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDataTable } from "@/hooks/use-data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
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

  const { fetchOrder, orders } = useOrderStore();

  React.useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const filteredData = React.useMemo(() => {
    return orders.filter((project) => {
      const matchesTitle =
        invoice_id === "" ||
        project.invoice_id.toLowerCase().includes(invoice_id.toLowerCase());

      return matchesTitle;
    });
  }, [invoice_id, orders]);

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
                <DropdownMenuItem variant="destructive">
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
    pageCount: 1,
    initialState: {
      sorting: [{ id: "invoice_id", desc: true }],
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
