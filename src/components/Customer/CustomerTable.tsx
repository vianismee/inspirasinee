// src/components/Customer/CustomerTable.tsx
"use client";

import React, { useMemo, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Trash2, Pencil, Send, Medal } from "lucide-react";

import { useDataTable } from "@/hooks/use-data-table";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { useQueryState, parseAsInteger, parseAsArrayOf, parseAsString } from "nuqs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCustomerStore } from "@/stores/customerStore";
import { ICustomers } from "@/types";
import { generateChatCustomer } from "@/lib/invoiceUtils";
import { cn } from "@/lib/utils";

interface CustomerTableProps {
  onEdit: (customer: ICustomers) => void;
  onView: (customer: ICustomers) => void;
}

// PostgREST v12+ returns one-to-one as object; older versions return array. Handle both.
function resolveMembership(raw: ICustomers["customer_memberships"]) {
  if (!raw) return null;
  return Array.isArray(raw) ? raw[0] ?? null : raw;
}

function getMemberBadgeClass(name: string) {
  switch (name.toLowerCase()) {
    case "bronze":
      return "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100";
    case "silver":
      return "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-100";
    case "gold":
      return "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100";
    default:
      return "";
  }
}

const MEMBERSHIP_LEVELS = ["Bronze", "Silver", "Gold"];

export function CustomerTable({ onEdit, onView }: CustomerTableProps) {
  const {
    customers,
    fetchCustomers,
    deleteCustomer,
    subscribeToCustomerChanges,
    totalCount,
    membershipCounts,
    fetchMembershipCounts,
  } = useCustomerStore();

  const [page] = useQueryState("page", parseAsInteger.withDefault(1));
  const [perPage] = useQueryState("perPage", parseAsInteger.withDefault(10));
  // Same key & separator that useDataTable writes (?member=Silver,Gold)
  const [memberFilter] = useQueryState(
    "member",
    parseAsArrayOf(parseAsString, ",").withDefault([])
  );

  useEffect(() => {
    fetchCustomers({
      page,
      pageSize: perPage,
      membershipLevels: memberFilter.length > 0 ? memberFilter : undefined,
    });
    fetchMembershipCounts();
    const unsubscribe = subscribeToCustomerChanges();
    return () => unsubscribe();
  }, [fetchCustomers, fetchMembershipCounts, subscribeToCustomerChanges, page, perPage, memberFilter]);

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
        id: "member",
        accessorFn: (row) =>
          resolveMembership(row.customer_memberships)?.customer_membership_levels?.name ?? "",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Member" />
        ),
        cell: ({ row }) => {
          const membership = resolveMembership(row.original.customer_memberships);
          const levelName = membership?.customer_membership_levels?.name ?? null;

          if (!levelName) {
            return (
              <Badge variant="outline" className="text-muted-foreground">
                Tidak Ada
              </Badge>
            );
          }

          return (
            <Badge
              variant="outline"
              className={cn(
                "flex items-center gap-1 w-fit",
                getMemberBadgeClass(levelName)
              )}
            >
              <Medal className="h-3 w-3" />
              {levelName}
            </Badge>
          );
        },
        meta: {
          label: "Member",
          variant: "multiSelect",
          options: MEMBERSHIP_LEVELS.map((level) => ({
            label: level,
            value: level,
          })),
        },
        filterFn: (row, _columnId, filterValue: string[]) => {
          if (!filterValue || filterValue.length === 0) return true;
          const levelName =
            resolveMembership(row.original.customer_memberships)
              ?.customer_membership_levels?.name ?? "";
          return filterValue.includes(levelName);
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

  const pageCount = Math.ceil(totalCount / perPage);

  const { table } = useDataTable({
    data: customers,
    columns,
    pageCount,
    initialState: {
      sorting: [{ id: "username", desc: false }],
      pagination: {
        pageSize: perPage,
        pageIndex: page - 1,
      },
    },
  });

  const totalMemberCount = MEMBERSHIP_LEVELS.reduce(
    (sum, level) => sum + (membershipCounts[level] || 0),
    0
  );

  return (
    <div className="space-y-4">
      {/* Member stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border bg-card p-3 text-center space-y-0.5">
          <p className="text-2xl font-bold">{totalMemberCount}</p>
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Medal className="h-3 w-3" /> Total Member
          </p>
        </div>
        {MEMBERSHIP_LEVELS.map((level) => (
          <div
            key={level}
            className={cn(
              "rounded-lg border p-3 text-center space-y-0.5",
              getMemberBadgeClass(level)
            )}
          >
            <p className="text-2xl font-bold">
              {membershipCounts[level] || 0}
            </p>
            <p className="text-xs font-medium">{level}</p>
          </div>
        ))}
      </div>

      <DataTable table={table}>
        <DataTableToolbar table={table} />
      </DataTable>
    </div>
  );
}
