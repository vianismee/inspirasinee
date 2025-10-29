"use client";

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";

// import { TrackingDesktop } from "./TrackingDesktop";
// import { TrackingMobile } from "./TrackingMobile";

interface TrackingPageProps {
  params: string;
}

type Order = {
  id: number;
  created_at: string;
  invoice_id: string;
  status: string;
};

export function TrackingApp({ params }: TrackingPageProps) {
  const [data, setData] = useState<Order | null>(null);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("invoice_id", params)
          .single();
        if (error) {
          throw error;
        }
        setData(data);
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    };
    fetchData();
  }, [params]);

  return (
    <div>
      <pre>{JSON.stringify(data)}</pre>
    </div>
  );
}
