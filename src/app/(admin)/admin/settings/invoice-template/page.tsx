"use client";

import { useEffect, useState } from "react";
import { useSettingsStore } from "@/stores/settingsStore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

export default function InvoiceTemplateSettingsPage() {
  const { invoiceTemplate, isLoading, fetchInvoiceTemplate, updateInvoiceTemplate } = useSettingsStore();
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchInvoiceTemplate();
  }, [fetchInvoiceTemplate]);

  useEffect(() => {
    if (invoiceTemplate !== null) {
      setContent(invoiceTemplate);
    }
  }, [invoiceTemplate]);

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error("Template tidak boleh kosong");
      return;
    }

    setIsSaving(true);
    const success = await updateInvoiceTemplate(content);
    setIsSaving(false);

    if (success) {
      toast.success("Template berhasil disimpan!");
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto p-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pengaturan Template Invoice</h1>
        <p className="text-muted-foreground mt-2">
          Atur format pesan WhatsApp yang akan dikirimkan ke pelanggan beserta invoice.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Template Pesan WhatsApp</CardTitle>
          <CardDescription>
            Gunakan variabel berikut untuk menampilkan data dinamis:<br />
            <code className="bg-muted px-1 py-0.5 rounded text-sm">[customer]</code> = Nama Pelanggan<br />
            <code className="bg-muted px-1 py-0.5 rounded text-sm">[code]</code> = Nomor Invoice<br />
            <code className="bg-muted px-1 py-0.5 rounded text-sm">[item]</code> = Daftar Item dan Harga<br />
            <code className="bg-muted px-1 py-0.5 rounded text-sm">[link]</code> = Link Tracking Pesanan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && !invoiceTemplate ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Halo kak, berikut invoice order [code]..."
                className="min-h-[250px] font-mono"
              />
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving || isLoading}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Simpan Template
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            Tampilan simulasi pesan (data disimulasikan).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-green-50/50 dark:bg-green-950/20 p-4 rounded-lg whitespace-pre-wrap font-sans text-sm border">
            {content
              .replace(/\[customer\]/g, "Budi Santoso")
              .replace(/\[code\]/g, "INV-20231010-001")
              .replace(/\[item\]/g, "nike\n  - Deep Cleaning Rp 35.000\n  - Whitening Rp 5.000\n\n-----------------------------------\nSubtotal: Rp 40.000\nTotal Pembayaran: Rp 40.000\nMetode Pembayaran: Pending")
              .replace(/\[link\]/g, "https://www.inspirasinee.my.id/tracking/INV-20231010-001")}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
