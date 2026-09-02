import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("phone") ?? "";
  const phone = raw.replace(/\D/g, "");

  if (!/^\d{8,15}$/.test(phone)) {
    return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();

    const { data: customer, error: customerError } = await admin
      .from("customers")
      .select("customer_id, username, email, whatsapp, alamat")
      .eq("whatsapp", phone)
      .maybeSingle();

    if (customerError || !customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const customerId = customer.customer_id;

    const [{ data: points }, { data: transactions }, { data: orders }] =
      await Promise.all([
        admin
          .from("customer_points")
          .select("current_balance, total_earned, total_redeemed")
          .eq("customer_id", customerId)
          .maybeSingle(),
        admin
          .from("points_transactions")
          .select("*")
          .eq("customer_id", customerId)
          .order("created_at", { ascending: false })
          .limit(10),
        // ponytail: orders ikut di sini agar page.tsx bebas anon-key query; tambah filter/pagination saat orderHistory membesar
        admin
          .from("orders")
          .select("*")
          .eq("customer_id", customerId)
          .order("created_at", { ascending: false }),
      ]);

    return NextResponse.json({
      customer,
      points:
        points ?? { current_balance: 0, total_earned: 0, total_redeemed: 0 },
      transactions: transactions ?? [],
      orders: orders ?? [],
    });
  } catch (e) {
    console.error("customer-dashboard route error", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
