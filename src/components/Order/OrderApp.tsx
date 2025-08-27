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
import { PhoneInput } from "@/components/ui/phone-input";
import { Textarea } from "@/components/ui/textarea";
import { useCustomerStore } from "@/stores/customerStore";
import { useRouter } from "next/navigation";
import { useCustomerID } from "@/hooks/useNanoID";

const formSchema = z.object({
  username: z.string().min(2, { message: "Nama Customer Wajib di Isi" }),
  email: z.string().optional(),
  whatsapp: z.string().min(2, { message: "Nomor WhatsApp Wajib di isi" }),
  alamat: z.string().optional(),
});

export function OrderApp() {
  const router = useRouter();
  const prepareCustomer = useCustomerStore((state) => state.prepareCustomer);
  const custoemerId = useCustomerID();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      whatsapp: "",
      alamat: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const customerData = {
        customer_id: custoemerId,
        ...values,
      };
      await prepareCustomer(customerData);
      router.push("/admin/order/service");
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
          name="username"
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
                  placeholder="085-XXXX-XXXX"
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
        <Button className="w-full" type="submit">
          Submit
        </Button>
      </form>
    </Form>
  );
}
