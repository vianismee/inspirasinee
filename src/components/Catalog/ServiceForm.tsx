"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";

// Impor Komponen UI
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Impor API & Store
import { uploadService } from "@/api/useUploadService";
import {
  useServiceCatalogStore,
  ServiceCatalog,
} from "@/stores/serviceCatalogStore";

// Props untuk komponen form
interface ServiceFormProps {
  onFormSuccess: () => void;
  initialData?: ServiceCatalog | null;
}

const formSchema = z.object({
  name: z.string().min(5, { message: "Nama harus minimal 5 karakter." }),
  amount: z.number().min(1000, { message: "Harga minimal Rp. 1000." }),
  category_id: z
    .number({ message: "Kategori harus dipilih." })
    .gt(0, { message: "Kategori harus dipilih." }),
});

export default function ServiceForm({
  onFormSuccess,
  initialData,
}: ServiceFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { serviceCategory, updateService } = useServiceCatalogStore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        amount: initialData.amount,
        category_id: initialData.service_category?.id,
      });
    } else {
      form.reset({
        name: "",
        amount: undefined,
        category_id: undefined,
      });
    }
  }, [initialData, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      if (initialData) {
        await updateService(initialData.id, values);
      } else {
        await uploadService({ service: values });
      }
      onFormSuccess();
    } catch (error) {
      console.error("Gagal menyimpan service:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Field Nama Service */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Service</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Deep Cleaning Shoes"
                  type="text"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Field Pilihan Kategori */}
        <FormField
          control={form.control}
          name="category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kategori</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(Number(value))}
                value={field.value ? String(field.value) : ""}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih kategori layanan" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {serviceCategory.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Field Harga */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Harga (Rp.)</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., 50000"
                  type="number"
                  {...field}
                  onChange={(event) => {
                    const value = event.target.value;
                    field.onChange(value === "" ? undefined : +value);
                  }}
                  // <<< PERBAIKAN: Gunakan `?? ""` untuk memastikan value tidak pernah undefined
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>Harga layanan dalam Rupiah.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading
            ? "Menyimpan..."
            : initialData
            ? "Simpan Perubahan"
            : "Simpan Service"}
        </Button>
      </form>
    </Form>
  );
}
