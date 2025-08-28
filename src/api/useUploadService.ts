import { createClient } from "@/utils/supabase/client";
import { IService } from "../types/index";

interface UseUploadServiceProps {
  service: IService;
}

export const uploadService = async ({ service }: UseUploadServiceProps) => {
  const supabase = createClient();
  console.log(service);
};
