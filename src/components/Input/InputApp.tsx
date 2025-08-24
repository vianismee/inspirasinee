"use client";
import { useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
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
import { PhoneInput } from "@/components/ui/phone-input";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  customer: z.string().min(5, { message: "Nama Customer Wajib di Isi" }),
  email: z.string().optional(),
  whatsapp: z.string().min(2, { message: "Nomor WhatsApp Wajib di isi" }),
  alamat: z.string().optional(),
});

export function InputApp() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer: "",
      email: "",
      whatsapp: "",
      alamat: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      console.log(values);
      toast(
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(values, null, 2)}</code>
        </pre>
      );
    } catch (error) {
      console.error("Form submission error", error);
      toast.error("Failed to submit the form. Please try again.");
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 max-w-3xl mx-auto py-10"
      >
        <FormField
          control={form.control}
          name="customer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Customer</FormLabel>
              <FormControl>
                <Input
                  className="border border-zinc-400"
                  placeholder="John Doe"
                  type=""
                  {...field}
                />
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
                  className="border-zinc-400"
                  placeholder="example@mail.com"
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
            <FormItem className="flex flex-col items-start">
              <FormLabel>WhatsApp</FormLabel>
              <FormControl className="w-full">
                <PhoneInput
                  className="border-zinc-400"
                  placeholder="856423123"
                  {...field}
                  defaultCountry="ID"
                />
              </FormControl>
              <FormDescription>WhatsApp Customer</FormDescription>
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
                <Textarea
                  placeholder=""
                  className="resize-none border-zinc-400"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Alamat Customer untuk Pickup / Pengiriman
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
