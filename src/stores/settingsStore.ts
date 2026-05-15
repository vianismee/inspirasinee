import { create } from "zustand";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

interface SettingsState {
  invoiceTemplate: string | null;
  isLoading: boolean;
  error: string | null;

  fetchInvoiceTemplate: () => Promise<void>;
  updateInvoiceTemplate: (newContent: string) => Promise<boolean>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  invoiceTemplate: null,
  isLoading: false,
  error: null,

  fetchInvoiceTemplate: async () => {
    set({ isLoading: true, error: null });
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("message_templates")
        .select("content")
        .eq("name", "invoice_whatsapp")
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // Row doesn't exist yet, we can fallback to default.
          const defaultTemplate = "Halo kak [customer], berikut invoice order [code].\n\n[item]\n\nBerikut link tracking order Anda: [link]\nTerimakasih atas kepercayaannya.";
          set({ invoiceTemplate: defaultTemplate, isLoading: false });
          return;
        }
        throw error;
      }

      if (data) {
        set({ invoiceTemplate: data.content, isLoading: false });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error fetching invoice template:", errorMessage);
      set({ error: errorMessage, isLoading: false });
    }
  },

  updateInvoiceTemplate: async (newContent: string) => {
    set({ isLoading: true, error: null });
    const supabase = createClient();
    try {
      // First, check if it exists
      const { data: existingData } = await supabase
        .from("message_templates")
        .select("id")
        .eq("name", "invoice_whatsapp")
        .single();

      if (existingData) {
        // Update existing
        const { error } = await supabase
          .from("message_templates")
          .update({
            content: newContent,
            updated_at: new Date().toISOString(),
          })
          .eq("name", "invoice_whatsapp");

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase.from("message_templates").insert({
          name: "invoice_whatsapp",
          content: newContent,
        });

        if (error) throw error;
      }

      set({ invoiceTemplate: newContent, isLoading: false });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error updating invoice template:", errorMessage);
      set({ error: errorMessage, isLoading: false });
      toast.error("Gagal menyimpan template invoice");
      return false;
    }
  },
}));
