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

const formSchema = z
  .object({
    label: z.string().min(3, { message: "Label harus minimal 3 karakter." }),
    // Preprocess menangani input kosong dari form sebelum divalidasi
    amount: z.preprocess(
      (val) => (val === "" || val == null ? undefined : val),
      z.coerce
        .number({ message: "Nominal harus berupa angka" })
        .positive("Nominal harus positif")
        .optional()
    ),
    percent: z.preprocess(
      (val) => (val === "" || val == null ? undefined : val),
      z.coerce
        .number({ message: "Persen harus berupa angka" })
        .min(0.01)
        .max(100, "Persen maksimal 100")
        .optional()
    ),
  })
  .refine((data) => !(data.amount && data.percent), {
    message: "Hanya isi salah satu, nominal atau persen.",
    path: ["amount"], // Tampilkan error di field nominal
  })
  .refine((data) => data.amount || data.percent, {
    message: "Salah satu dari nominal atau persen harus diisi.",
    path: ["percent"], // Tampilkan error di field persen
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
        // Konversi dari 0.xx ke xx% untuk ditampilkan di form
        percent: initialData.percent ? initialData.percent * 100 : undefined,
      });
    } else {
      form.reset({ label: "", amount: undefined, percent: undefined });
    }
  }, [initialData, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const dataToSubmit = {
      label: values.label,
      amount: values.amount || null,
      // Konversi dari xx% ke 0.xx untuk disimpan di database
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
                <Input
                  type="number"
                  placeholder="e.g., 10000"
                  {...field}
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
                <Input
                  type="number"
                  placeholder="e.g., 15"
                  {...field}
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
