"use client";

import type { ColumnDef } from "@tanstack/react-table";
// Impor ikon
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
  CheckCheck,
} from "lucide-react";
// Impor dari nuqs untuk state di URL
import {
  parseAsArrayOf,
  parseAsString,
  useQueryState,
  parseAsInteger,
} from "nuqs";
import * as React from "react";

// Impor komponen UI
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Separator } from "@/components/ui/separator";

// Impor lain-lain
import { useDataTable } from "@/hooks/use-data-table";
import formatTimeAgo from "@/lib/formatDateAgo";
import { generateReceiptText } from "@/lib/invoiceUtils";
import { formatedCurrency } from "@/lib/utils";
import { useOrderStore } from "@/stores/orderStore";
// UBAH: Impor tipe Orders dari file global
import { Orders, IItems } from "@/types";

// UBAH: Hapus definisi interface Orders lokal karena sudah diimpor

export default function TableJob() {
  // ... state dan hooks tidak berubah ...
  const [invoice_id] = useQueryState(
    "invoice_id",
    parseAsString.withDefault("")
  );
  const [status] = useQueryState(
    "status",
    parseAsArrayOf(parseAsString).withDefault([])
  );
  const [page] = useQueryState("page", parseAsInteger.withDefault(1));
  const [perPage] = useQueryState("perPage", parseAsInteger.withDefault(10));
  const {
    fetchOrder,
    orders,
    count,
    subscribeToOrders,
    deleteInvoice,
    updateOrderStep,
    updatePayment,
  } = useOrderStore();

  React.useEffect(() => {
    fetchOrder({ page, pageSize: perPage });
    const unsubscribe = subscribeToOrders();
    return () => unsubscribe();
  }, [fetchOrder, subscribeToOrders, page, perPage]);

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
      // ... kolom select, invoice_id tidak berubah ...
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
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Invoice" />
        ),
        cell: ({ cell }) => <div>{cell.getValue<string>()}</div>,
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
          const order = row.original;
          return (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="link"
                  className="h-auto p-0 text-blue-600 hover:underline focus-visible:ring-0"
                >
                  {order.customers.username}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                {/* ... DialogHeader dan Detail Pelanggan tidak berubah ... */}
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
                <div className="flex flex-col gap-3">
                  <h3 className="font-semibold text-md">Detail Pelanggan</h3>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4" />
                      <span>{order.customers.username}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4" />
                      <span>{order.customers.whatsapp}</span>
                    </div>
                    {order.customers.alamat && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                        <span>{order.customers.alamat}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Separator />
                <div className="flex flex-col gap-3">
                  <h3 className="font-semibold text-md">Order Detail</h3>
                  {/* === UBAH BAGIAN INI === */}
                  <div className="flex flex-col gap-4">
                    {order.order_item.map((groupedItem, index) => (
                      <div
                        key={groupedItem.shoe_name + index}
                        className="flex flex-col text-sm"
                      >
                        <span className="font-bold">
                          {groupedItem.shoe_name}
                        </span>
                        <div className="flex flex-col pl-2 mt-1 space-y-1">
                          {groupedItem.services.map((service, serviceIndex) => (
                            <div
                              key={service.service + serviceIndex}
                              className="flex justify-between items-center"
                            >
                              <span className="text-xs text-muted-foreground">
                                - {service.service}
                              </span>
                              <span className="font-mono text-xs">
                                {formatedCurrency(parseFloat(service.amount))}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* === AKHIR BAGIAN PERUBAHAN === */}
                </div>
                {/* ... Sisa dialog tidak berubah ... */}
                <Separator />
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-mono">
                      {formatedCurrency(order.subtotal)}
                    </span>
                  </div>
                  {order.order_discounts?.map((discount, index) => (
                    <div
                      key={discount.discount_code + index}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="text-muted-foreground">
                        Diskon ({discount.discount_code})
                      </span>
                      <span className="font-mono text-green-600">
                        -{formatedCurrency(discount.discounted_amount)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center text-md font-bold mt-2 pt-2 border-t">
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
      // ... kolom status, payment, created_at, dan actions tidak berubah ...
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
              className: "bg-green-600 hover:bg-green-600/80 text-white",
              icon: CheckCircle2,
            },
          ];
          const currentStatusValue = row.getValue<string>("status");
          const currentStatus = statusOptions.find(
            (s) => s.value === currentStatusValue
          );
          if (!currentStatus) return <span>-</span>;
          const Icon = currentStatus.icon;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-auto p-1 rounded-full focus-visible:ring-0"
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
                    onSelect={() =>
                      updateOrderStep(row.original.invoice_id, status.value)
                    }
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
              className: "bg-green-600 hover:bg-green-600/80 text-white",
            },
            {
              value: "Cash",
              label: "Cash",
              className: "bg-green-600 hover:bg-green-600/80 text-white",
            },
            {
              value: "Pending",
              label: "Pending",
              variant: "destructive" as const,
            },
          ];
          const currentPaymentValue = row.getValue<string>("payment");
          const currentPayment = statusPayment.find(
            (p) => p.value === currentPaymentValue
          );
          if (!currentPayment) return <span>-</span>;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={"ghost"}
                  className="h-auto p-1 rounded-full focus-visible:ring-0"
                >
                  <Badge
                    variant={currentPayment?.variant}
                    className={currentPayment?.className}
                  >
                    {currentPayment?.label}
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ubah Metode</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {statusPayment.map((status) => (
                  <DropdownMenuItem
                    key={status.value}
                    onSelect={() =>
                      updatePayment(row.original.invoice_id, status.value)
                    }
                    disabled={currentPaymentValue === status.value}
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
        header: ({ column }) => (
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
            // ... fungsi ini tidak berubah
            if (!order.customers?.whatsapp) {
              alert("Nomor WhatsApp customer tidak ditemukan.");
              return;
            }
            const formattedDiscounts = order.order_discounts?.map((d) => ({
              label: d.discount_code,
              amount: d.discounted_amount,
            }));
            const receiptText = generateReceiptText({
              customer: order.customers,
              invoice: order.invoice_id,
              cart: order.order_item.flatMap((item) =>
                item.services.map((service) => ({
                  shoe_name: item.shoe_name,
                  service: service.service,
                  amount: service.amount,
                }))
              ),
              subTotal: order.subtotal,
              totalPrice: order.total_price,
              payment: order.payment,
              discounts: formattedDiscounts,
            });
            const encodedText = encodeURIComponent(receiptText);
            const whatsappURL = `https://wa.me/${order.customers.whatsapp}?text=${encodedText}`;
            window.open(whatsappURL, "_blank");
          };

          // BARU: Definisikan aksi untuk tombol Selesaikan (ganti dengan logikamu)
          const handleCompleteOrder = () => {
            // CONTOH: Ganti alert ini dengan logikamu, misalnya memindahkan order ke arsip
            alert(
              `Menyelesaikan dan mengarsipkan invoice: ${order.invoice_id}`
            );
          };

          return (
            <div className="flex items-center justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={handleSendWhatsapp}
                    className="flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Kirim Invoice
                  </DropdownMenuItem>

                  {/* === TOMBOL BARU DITAMBAHKAN DI SINI === */}
                  <DropdownMenuItem
                    onSelect={handleCompleteOrder}
                    disabled={order.status !== "finish"} // <-- Kondisi di sini
                    className="flex items-center gap-2"
                  >
                    <CheckCheck className="h-4 w-4" />
                    Selesaikan
                  </DropdownMenuItem>
                  {/* === AKHIR DARI TOMBOL BARU === */}

                  <DropdownMenuItem
                    className="flex items-center gap-2 text-red-600 focus:bg-red-50 focus:text-red-600"
                    onSelect={() => deleteInvoice(order.invoice_id)}
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
        enableHiding: false,
      },
    ],
    [deleteInvoice, updateOrderStep, updatePayment]
  );

  const pageCount = React.useMemo(() => {
    if (count === 0) return 1;
    return Math.ceil(count / perPage);
  }, [count, perPage]);

  const { table } = useDataTable({
    data: filteredData,
    columns,
    pageCount: pageCount,
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
