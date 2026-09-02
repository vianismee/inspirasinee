import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/server";

// Kolom sesuai schema.sql — orders tidak punya payment_method/payment_status/updated_at,
// jadi di-map ke bentuk SimpleOrderData yang diharapkan consumer lama.
const INVOICE_RE = /^[A-Za-z0-9_-]{3,30}$/;

export async function GET(req: NextRequest) {
  const invoice = req.nextUrl.searchParams.get("invoice") ?? "";
  if (!INVOICE_RE.test(invoice)) {
    return NextResponse.json({ error: "invalid invoice" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: order, error } = await admin
    .from("orders")
    .select("invoice_id, status, subtotal, payment, total_price, created_at")
    .eq("invoice_id", invoice)
    .maybeSingle();

  if (error || !order) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const { data: items } = await admin
    .from("order_item")
    .select(
      "id, service, shoe_name, custom_shoe_name, amount, item_number, color, size"
    )
    .eq("invoice_id", invoice)
    .order("id", { ascending: true })
    .limit(50);

  // ponytail: mapping kolom legacy → SimpleOrderItem; upgrade saat schema dinormalisasi.
  return NextResponse.json({
    order: {
      invoice_id: order.invoice_id,
      customer_id: "", // masking PII — tidak ada data customer di response
      status: order.status,
      total_price: order.total_price ?? 0,
      subtotal: order.subtotal ?? 0,
      payment_method: order.payment ?? "",
      payment_status: order.payment ?? "",
      created_at: order.created_at,
      updated_at: order.created_at, // orders tidak punya updated_at
    },
    items: (items ?? []).map((it: Record<string, unknown>) => ({
      id: String(it.id),
      service_name: (it.service as string) ?? "",
      shoe_name: (it.shoe_name as string) ?? (it.custom_shoe_name as string) ?? "",
      quantity: (it.item_number as number) ?? 1,
      unit_price: (it.amount as number) ?? 0,
      total_price: (it.amount as number) ?? 0,
      notes: ((it.color as string) || (it.size as string)) || undefined,
    })),
  });
}
