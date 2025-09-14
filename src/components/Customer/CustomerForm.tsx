// src/components/Customer/CustomerForm.tsx

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { useCustomerStore } from "@/stores/customerStore";
import { ICustomers } from "@/types";

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
import { Textarea } from "../ui/textarea";
import { PhoneInput } from "../ui/phone-input";

interface CustomerFormProps {
  onFormSuccess: () => void;
  initialData?: ICustomers | null;
}

const formSchema = z.object({
  username: z.string().min(2, { message: "Nama Customer Wajib di Isi" }),
  email: z
    .string()
    .email({ message: "Email tidak valid" })
    .optional()
    .or(z.literal("")),
  whatsapp: z.string().min(2, { message: "Nomor WhatsApp Wajib di isi" }),
  alamat: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof formSchema>;

export default function CustomerForm({
  onFormSuccess,
  initialData,
}: CustomerFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { updateCustomer } = useCustomerStore();

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      whatsapp: "",
      alamat: "",
      email: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form]);

  async function onSubmit(values: CustomerFormValues) {
    if (!initialData) return;
    setIsLoading(true);

    try {
      await updateCustomer(initialData.customer_id, values);
      onFormSuccess();
    } catch (error) {
      console.error("Gagal menyimpan data customer:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Customer</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="email@example.com"
                  type="email"
                  {...field}
                />
              </FormControl>
              <FormDescription>(Opsional)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="whatsapp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>WhatsApp</FormLabel>
              <FormControl>
                <PhoneInput defaultCountry="ID" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="alamat"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alamat</FormLabel>
              <FormControl>
                <Textarea placeholder="Alamat lengkap..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </form>
    </Form>
  );
}
