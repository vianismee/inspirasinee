"use client";

import { Card, CardContent, CardDescription } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ICustomers } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "../ui/separator";
import {
  Phone,
  Mail,
  MapPin,
  BrushCleaning,
  Wallet,
  Search,
  Send,
} from "lucide-react";
import { formatedCurrency } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { useState } from "react";
import { Button } from "../ui/button";
import { generateChatCustomer } from "@/lib/invoiceUtils";

interface CustomerCardProps {
  customer: ICustomers | null;
}

export function CustomerCard({ customer }: CustomerCardProps) {
  const [searchInvoice, setSearchInvoice] = useState("");

  if (!customer) {
    return (
      <Card className="p-6 flex items-center justify-center h-full border-0 shadow-lg">
        <CardDescription>Memuat data pelanggan...</CardDescription>
      </Card>
    );
  }

  const handleSendMessage = () => {
    const message = generateChatCustomer(customer);
    const whatsappUrl = `https://wa.me/${
      customer.whatsapp
    }?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const filteredOrders =
    customer.orders?.filter((order) =>
      order.invoice_id.toLowerCase().includes(searchInvoice.toLowerCase())
    ) || [];

  return (
    <Card className="shadow-lg border-0">
      <CardContent className="space-y-4 pt-0 p-6">
        <DialogHeader className="p-6">
          <div className="flex flex-col items-center text-center gap-2">
            <Avatar className="w-20 h-20 text-3xl">
              <AvatarFallback>
                {customer.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <DialogTitle>{customer.username}</DialogTitle>
              <CardDescription>ID: {customer.customer_id}</CardDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="space-y-1 p-2 rounded-md bg-muted/50">
            <div>
              <BrushCleaning className="w-5 h-5 mx-auto text-muted-foreground" />
              <p className="font-bold text-lg">
                {customer.orders?.length || 0}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">Total Service</p>
          </div>
          <div className="space-y-1 p-2 rounded-md bg-muted/50">
            <Wallet className="w-5 h-5 mx-auto text-muted-foreground" />
            <p className="font-bold text-lg">
              {formatedCurrency(customer.totalSpent || 0)}
            </p>
            <p className="text-xs text-muted-foreground">Total Spent</p>
          </div>
        </div>
        <Separator />
        <div>
          <h4 className="font-semibold mb-3 text-sm">Info Kontak</h4>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>{customer.whatsapp}</span>
            </div>
            {customer.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{customer.email}</span>
              </div>
            )}
            {customer.alamat && (
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                <span>{customer.alamat}</span>
              </div>
            )}
          </div>
        </div>
        <Separator />
        <div>
          <h4 className="font-semibold mb-2 text-sm">Riwayat Pesanan</h4>
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cari invoice untuk melihat riwayat..."
              className="pl-8 h-9"
              value={searchInvoice}
              onChange={(e) => setSearchInvoice(e.target.value)}
            />
          </div>
          {searchInvoice && (
            <Accordion type="single" collapsible className="w-full">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <AccordionItem
                    key={order.invoice_id}
                    value={order.invoice_id}
                  >
                    <AccordionTrigger>
                      <div className="flex justify-between w-full pr-4">
                        <span className="font-mono text-sm">
                          {order.invoice_id}
                        </span>
                        <Badge variant="outline">{order.status}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 text-xs pl-2 border-l-2 ml-2">
                        <p>
                          <strong>Tanggal:</strong>{" "}
                          {new Date(order.created_at).toLocaleDateString(
                            "id-ID"
                          )}
                        </p>
                        <p>
                          <strong>Total:</strong>{" "}
                          {formatedCurrency(order.total_price)}
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Tidak ada riwayat pesanan yang cocok.
                </p>
              )}
            </Accordion>
          )}
        </div>
        <Button className="w-full" onClick={handleSendMessage}>
          <Send className="mr-2 h-4 w-4" /> Hubungi Pelanggan
        </Button>
      </CardContent>
    </Card>
  );
}
