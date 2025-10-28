import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");

    if (!phone) {
      return NextResponse.json(
        { error: "Phone parameter is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get all customers to see the structure
    const { data: allCustomers } = await supabase
      .from("customers")
      .select("*")
      .limit(10);

    // Search for the specific phone in different ways
    const searches = [];

    // Search 1: customer_id exact match
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("customer_id", phone)
        .single();

      searches.push({
        type: "customer_id_exact",
        phone,
        found: !!data,
        data: data || null,
        error: error?.message || null
      });
    } catch (error) {
      searches.push({
        type: "customer_id_exact",
        phone,
        found: false,
        data: null,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    // Search 2: whatsapp field
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("whatsapp", phone)
        .single();

      searches.push({
        type: "whatsapp_exact",
        phone,
        found: !!data,
        data: data || null,
        error: error?.message || null
      });
    } catch (error) {
      searches.push({
        type: "whatsapp_exact",
        phone,
        found: false,
        data: null,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    // Search 3: phone field
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("phone", phone)
        .single();

      searches.push({
        type: "phone_exact",
        phone,
        found: !!data,
        data: data || null,
        error: error?.message || null
      });
    } catch (error) {
      searches.push({
        type: "phone_exact",
        phone,
        found: false,
        data: null,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    // Search 4: OR search
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .or(`whatsapp.eq.${phone},phone.eq.${phone},customer_id.eq.${phone}`)
        .limit(5);

      searches.push({
        type: "or_search",
        phone,
        found: !!(data && data.length > 0),
        data: data || null,
        error: error?.message || null
      });
    } catch (error) {
      searches.push({
        type: "or_search",
        phone,
        found: false,
        data: null,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    // Search 5: LIKE search
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .or(`whatsapp.ilike.%${phone}%,phone.ilike.%${phone}%,customer_id.ilike.%${phone}%`)
        .limit(5);

      searches.push({
        type: "like_search",
        phone,
        found: !!(data && data.length > 0),
        data: data || null,
        error: error?.message || null
      });
    } catch (error) {
      searches.push({
        type: "like_search",
        phone,
        found: false,
        data: null,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    return NextResponse.json({
      searchedPhone: phone,
      allCustomersSample: allCustomers,
      searches,
      totalSearches: searches.length,
      successfulSearches: searches.filter(s => s.found).length
    });

  } catch (error) {
    console.error("Error in debug search:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}