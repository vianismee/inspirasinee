"use client";

import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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

// LANGKAH 1: Ubah skema untuk hanya menerima 'number'
const formSchema = z.object({
  name: z.string().min(5, { message: "Nama harus minimal 5 karakter." }),
  amount: z.number().min(0, { message: "Harga tidak boleh negatif." }),
});

export default function ServiceForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    toast(
      <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
        <code className="text-white">{JSON.stringify(values, null, 2)}</code>
      </pre>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 max-w-3xl mx-auto py-10"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Service</FormLabel>
              <FormControl>
                <Input placeholder="Deep Cleans" type="text" {...field} />
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
              <FormLabel>Harga (Rp. )</FormLabel>
              <FormControl>
                <Input
                  placeholder="10000"
                  type="number"
                  {...field}
                  onChange={(event) => {
                    const value = event.target.value;
                    field.onChange(value === "" ? undefined : +value);
                  }}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>Harga dalam Rupiah</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
