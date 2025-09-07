"use client";

import type { Column, ColumnDef } from "@tanstack/react-table";
// Impor semua ikon yang dibutuhkan dari lucide-react
import {
  MoreHorizontal,
  Text,
  Send,
  Trash2,
  Hourglass,
  CircleDashed,
  Sparkles,
  CheckCircle2,
  User,
  Phone,
  MapPin,
} from "lucide-react";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";
import * as React from "react";

// Impor komponen UI dari shadcn/ui
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

// Impor hooks, stores, dan tipe data
import { useDataTable } from "@/hooks/use-data-table";
import { useOrderStore } from "@/stores/orderStore";
import { ICustomers, IDiscount, IItems } from "@/types";
import formatTimeAgo from "@/lib/formatDateAgo";

// Impor fungsi utilitas
import { generateReceiptText } from "@/lib/invoiceUtils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
} from "../ui/dialog";
import { DialogTitle, DialogTrigger } from "@radix-ui/react-dialog";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { formatedCurrency } from "@/lib/utils";

// Interface untuk struktur data order
interface Orders {
  customer_id: string;
  invoice_id: string;
  customers: ICustomers;
  status: string;
  order_item: IItems[];
  subtotal: number;
  order_discounts?: IDiscount[];
  total_price: number;
  payment: string;
  created_at: string;
}

export default function TableJob() {
  const [invoice_id] = useQueryState(
    "invoice_id",
    parseAsString.withDefault("")
  );

  const [status] = useQueryState(
    "status",
    parseAsArrayOf(parseAsString).withDefault([])
  );

  const { fetchOrder, orders, subscribeToOrders, deleteInvoice } =
    useOrderStore();

  React.useEffect(() => {
    fetchOrder();
    const unsubscribe = subscribeToOrders();
    return () => {
      unsubscribe();
    };
  }, [fetchOrder, subscribeToOrders]);

  const filteredData = React.useMemo(() => {
    return orders.filter((project) => {
      const matchesTitle =
        invoice_id === "" ||
        project.invoice_id.toLowerCase().includes(invoice_id.toLowerCase());
      const matchesStatus =
        status.length === 0 || status.includes(project.status);
      return matchesTitle && matchesStatus;
    });
  }, [invoice_id, orders, status]);

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
        id: "customer",
        accessorKey: "customers",
        header: "Customer",
        cell: ({ row }) => {
          const order = row.original; // Ambil data order untuk kemudahan akses

          return (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant={"link"}
                  className="h-auto p-0 text-blue-600 hover:underline focus-visible:ring-0"
                >
                  {order.customers.username}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold tracking-wider">
                    {order.invoice_id}
                  </DialogTitle>
                  <DialogDescription>
                    {new Date(order.created_at).toLocaleDateString("id-ID", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </DialogDescription>
                </DialogHeader>

                <Separator />

                {/* === Detail Pelanggan === */}
                <div className="flex flex-col gap-3">
                  <h3 className="font-semibold text-md">Detail Pelanggan</h3>
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4" />
                      <span>{order.customers.username}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <Phone className="w-4 h-4" />
                      <span>{order.customers.whatsapp}</span>
                    </div>
                    {order.customers.alamat && (
                      <div className="flex items-start gap-3 mt-2">
                        <MapPin className="w-4 h-4 mt-1" />
                        <span>{order.customers.alamat}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* === Detail Layanan === */}
                <div className="flex flex-col gap-3">
                  <h3 className="font-semibold text-md">Order Detail</h3>
                  <div className="flex flex-col gap-4">
                    {order.order_item.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center text-sm"
                      >
                        <div className="flex flex-col">
                          <span className="font-bold">{item.shoe_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {item.service}
                          </span>
                        </div>
                        <span className="font-mono">
                          {formatedCurrency(parseFloat(item.amount))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* === Ringkasan Pembayaran === */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-mono">
                      {formatedCurrency(order.subtotal)}
                    </span>
                  </div>
                  {order.order_discounts &&
                    order.order_discounts.length > 0 &&
                    order.order_discounts.map((discount, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center text-sm"
                      >
                        {/* Menggunakan discount_code sebagai label */}
                        <span className="text-muted-foreground">
                          Diskon ({discount.discount_code})
                        </span>
                        <span className="font-mono text-green-600">
                          {/* Menggunakan discounted_amount langsung untuk nilainya */}
                          -{formatedCurrency(discount.discounted_amount)}
                        </span>
                      </div>
                    ))}
                  <div className="flex justify-between items-center text-md font-bold">
                    <span>Total Pembayaran</span>
                    <span className="font-mono">
                      {formatedCurrency(order.total_price)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-2 pt-2 border-t">
                    <span className="text-muted-foreground">
                      Metode Pembayaran
                    </span>
                    <span>
                      {order.payment === "Pending" ? (
                        <Badge variant="destructive">{order.payment}</Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
                          {order.payment}
                        </Badge>
                      )}
                    </span>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          );
        },
      },
      {
        id: "status",
        accessorKey: "status",
        header: "Status",
        cell: function Cell({ row }) {
          const statusOptions = [
            {
              value: "ongoing",
              label: "Ongoing",
              variant: "outline" as const,
              icon: CircleDashed,
            },
            {
              value: "pending",
              label: "Pending",
              variant: "secondary" as const,
              icon: Hourglass,
            },
            {
              value: "cleaning",
              label: "Cleaning",
              variant: "default" as const,
              icon: Sparkles,
            },
            {
              value: "finish",
              label: "Finish",
              className:
                "border-transparent bg-green-500 text-primary-foreground shadow hover:bg-green-500/80",
              icon: CheckCircle2,
            },
          ];

          const currentStatusValue = row.getValue<string>("status");
          const currentStatus = statusOptions.find(
            (status) => status.value === currentStatusValue
          );
          const { updateOrderStep } = useOrderStore.getState();
          const invoiceId = (row.original as { invoice_id: string }).invoice_id;

          if (!currentStatus) {
            return <span>-</span>;
          }

          const Icon = currentStatus.icon;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-auto p-1 focus-visible:ring-0"
                >
                  <Badge
                    variant={currentStatus.variant}
                    className={`${currentStatus.className} flex items-center gap-1.5`}
                  >
                    <Icon className="h-3 w-3" />
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
                    disabled={currentStatusValue === status.value}
                  >
                    {status.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
        meta: {
          label: "Status",
          variant: "multiSelect",
          options: [
            { label: "Ongoing", value: "ongoing" },
            { label: "Pending", value: "pending" },
            { label: "Cleaning", value: "cleaning" },
            { label: "Finish", value: "finish" },
          ],
        },
        enableColumnFilter: true,
      },
      {
        id: "payment",
        accessorKey: "payment",
        header: "Payment",
        cell: function Cell({ row }) {
          const statusPayment = [
            {
              value: "QRIS",
              label: "QRIS",
              className:
                "border-transparent bg-green-500 text-primary-foreground shadow",
            },
            {
              value: "Cash",
              label: "Cash",
              className:
                "border-transparent bg-green-500 text-primary-foreground shadow",
            },
            {
              value: "Pending",
              label: "Pending",
              variant: "destructive" as const,
            },
          ];

          const currentPaymentValue = row.getValue<string>("payment");
          const currentPayement = statusPayment.find(
            (status) => status.value === currentPaymentValue
          );
          const { updatePayment } = useOrderStore.getState();
          const invoiceId = (row.original as { invoice_id: string }).invoice_id;

          if (!currentPayement) {
            return <span>-</span>;
          }

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={"ghost"}
                  className="h-auto p-1 focus-visible:ring-0"
                >
                  <Badge
                    variant={currentPayement?.variant}
                    className={currentPayement?.className}
                  >
                    {currentPayement?.label}
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ubah Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {statusPayment.map((status) => (
                  <DropdownMenuItem
                    key={status.value}
                    onSelect={() => {
                      updatePayment(invoiceId, status.value);
                    }}
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
        id: "created_at",
        accessorKey: "created_at",
        header: ({ column }: { column: Column<Orders, unknown> }) => (
          <DataTableColumnHeader column={column} title="Date Order" />
        ),
        cell: ({ row }) => (
          <div>{formatTimeAgo(row.getValue("created_at"))}</div>
        ),
      },
      {
        id: "actions",
        cell: function Cell({ row }) {
          const order = row.original;
          const handleSendWhatsapp = () => {
            if (!order.customers?.whatsapp) {
              alert("Nomor WhatsApp customer tidak ditemukan.");
              return;
            }
            const receiptText = generateReceiptText({
              customer: order.customers,
              invoice: order.invoice_id,
              cart: order.order_item,
              subTotal: order.subtotal,
              totalPrice: order.total_price,
              payment: order.payment,
            });
            const encodedText = encodeURIComponent(receiptText);
            const whatsappURL = `https://wa.me/${order.customers.whatsapp}?text=${encodedText}`;
            window.open(whatsappURL, "_blank");
          };
          return (
            <div className="bg-white flex h-full w-full items-center justify-center ">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={handleSendWhatsapp}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                    Kirim Invoice
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600 flex items-center gap-2 cursor-pointer"
                    onSelect={() => deleteInvoice(order.invoice_id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
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
    [deleteInvoice]
  );

  const { table } = useDataTable({
    data: filteredData,
    columns,
    pageCount: 1,
    initialState: {
      sorting: [{ id: "created_at", desc: true }],
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
