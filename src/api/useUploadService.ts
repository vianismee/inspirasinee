import { createClient } from "@/utils/supabase/client";
import { IService } from "../types/index";
import { toast } from "sonner";

interface UseUploadServiceProps {
  service: IService;
}

export const uploadService = async ({ service }: UseUploadServiceProps) => {
  const finalDataService = {
    name: service.name,
    category_id: service.category_id,
    amount: service.amount,
  };

  const supabase = createClient();
  try {
    const { error: insertError } = await supabase
      .from("service_catalog")
      .insert(finalDataService)
      .single();
    if (insertError) {
      console.log("Gagal Menambah Service", insertError);
    }
    toast.success("Berhasil menambah Service");
  } catch (error) {
    console.log(error);
  }
};
