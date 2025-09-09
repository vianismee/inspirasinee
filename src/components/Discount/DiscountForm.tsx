// components/discount/DiscountForm.tsx

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { useServiceCatalogStore, Discount } from "@/stores/serviceCatalogStore";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface DiscountFormProps {
  onFormSuccess: () => void;
  initialData?: Discount | null;
}

// ✅ PERBAIKAN 1: Sederhanakan skema, hapus preprocess/coerce
const formSchema = z
  .object({
    label: z.string().min(3, { message: "Label harus minimal 3 karakter." }),
    amount: z.number().positive("Nominal harus positif").optional(),
    percent: z.number().min(0.01).max(100, "Persen maksimal 100").optional(),
  })
  .refine((data) => !(data.amount && data.percent), {
    message: "Hanya isi salah satu, nominal atau persen.",
    path: ["amount"],
  })
  .refine((data) => data.amount || data.percent, {
    message: "Salah satu dari nominal atau persen harus diisi.",
    path: ["percent"],
  });

type DiscountFormValues = z.infer<typeof formSchema>;

export default function DiscountForm({
  onFormSuccess,
  initialData,
}: DiscountFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { addDiscount, updateDiscount } = useServiceCatalogStore();

  const form = useForm<DiscountFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      label: "",
      amount: undefined,
      percent: undefined,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        label: initialData.label || "",
        amount: initialData.amount ?? undefined,
        percent: initialData.percent ? initialData.percent * 100 : undefined,
      });
    } else {
      form.reset({ label: "", amount: undefined, percent: undefined });
    }
  }, [initialData, form]);

  async function onSubmit(values: DiscountFormValues) {
    setIsLoading(true);
    // Pastikan data yang dikirim tidak mengandung undefined
    const dataToSubmit = {
      label: values.label,
      amount: values.amount || null,
      percent: values.percent ? values.percent / 100 : null,
    };

    try {
      if (initialData) {
        await updateDiscount(initialData.id, dataToSubmit);
      } else {
        await addDiscount(dataToSubmit);
      }
      onFormSuccess();
    } catch (error) {
      console.error("Gagal menyimpan diskon:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="label"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Label Diskon</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Diskon Kemerdekaan" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nominal (Rp.)</FormLabel>
              <FormControl>
                {/* ✅ PERBAIKAN 2: Tambahkan onChange kustom seperti di ServiceForm */}
                <Input
                  type="number"
                  placeholder="e.g., 10000"
                  {...field}
                  onChange={(event) => {
                    const value = event.target.value;
                    field.onChange(value === "" ? undefined : +value);
                  }}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>
                Isi jika diskon berupa potongan harga tetap.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="percent"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Persentase (%)</FormLabel>
              <FormControl>
                {/* ✅ PERBAIKAN 3: Tambahkan onChange kustom seperti di ServiceForm */}
                <Input
                  type="number"
                  placeholder="e.g., 15"
                  {...field}
                  onChange={(event) => {
                    const value = event.target.value;
                    field.onChange(value === "" ? undefined : +value);
                  }}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>
                Isi jika diskon berupa potongan persen (contoh: isi 15 untuk
                15%).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading
            ? "Menyimpan..."
            : initialData
            ? "Simpan Perubahan"
            : "Tambah Diskon"}
        </Button>
      </form>
    </Form>
  );
}
