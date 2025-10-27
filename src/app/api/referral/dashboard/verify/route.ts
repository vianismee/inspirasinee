import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import crypto from "crypto";

interface PhoneValidationResult {
  success: boolean;
  redirectTo?: string;
  error?: string;
}

// Hash generation with timestamp for link expiry (not dashboard session)
function generateSecureHash(phone: string): { hash: string; expiresAt: Date } {
  const timestamp = Date.now();
  const randomSalt = crypto.randomBytes(16).toString('hex');
  const hashInput = `${phone}:${timestamp}:${randomSalt}`;
  const hash = crypto.createHash('sha256').update(hashInput).digest('hex').substring(0, 12);

  // Link expires after 1 hour, but once accessed, dashboard session lasts much longer
  return {
    hash,
    expiresAt: new Date(timestamp + 60 * 60 * 1000) // 1 hour expiry for initial link
  };
}

// RATE LIMITING DEACTIVATED FOR DEBUGGING
// Rate limiting in-memory storage (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; lastAttempt: number }>();

function checkRateLimit(phone: string, ip: string): boolean {
  // DEACTIVATED: Always return true for debugging
  console.log("🔓 RATE LIMITING DEACTIVATED - Allowing access");
  return true;

  // Original rate limiting code (commented out for debugging)
  /*
  const key = `${phone}:${ip}`;
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour window
  const maxAttempts = 3;

  const record = rateLimitStore.get(key);

  if (!record) {
    rateLimitStore.set(key, { count: 1, lastAttempt: now });
    return true;
  }

  if (now - record.lastAttempt > windowMs) {
    // Reset the window
    rateLimitStore.set(key, { count: 1, lastAttempt: now });
    return true;
  }

  if (record.count >= maxAttempts) {
    return false;
  }

  record.count++;
  record.lastAttempt = now;
  return true;
  */
}

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 STARTING PHONE VERIFICATION DEBUG");

    const body = await request.json();
    const { phone } = body;

    console.log("📞 Original phone input:", phone);

    if (!phone) {
      console.log("❌ No phone provided");
      return NextResponse.json(
        { error: "Nomor telepon harus diisi" },
        { status: 400 }
      );
    }

    // Basic phone validation for Indonesian format - MORE RELAXED FOR DEBUGGING
    const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');
    console.log("🧹 Cleaned phone:", cleanedPhone);

    // DEACTIVATED: More lenient phone validation for debugging
    console.log("🔓 PHONE VALIDATION DEACTIVATED - Accepting all phone formats");
    /*
    if (!/^(\+62|62|0)8[0-9]{8,12}$/.test(cleanedPhone)) {
      console.log("❌ Phone format validation failed");
      return NextResponse.json(
        { error: "Format nomor telepon tidak valid. Gunakan format Indonesia (contoh: +628123456789)" },
        { status: 400 }
      );
    }
    */

    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    console.log("🌐 Client IP:", ip);

    // Check rate limiting
    if (!checkRateLimit(cleanedPhone, ip)) {
      console.log("❌ Rate limiting failed");
      return NextResponse.json(
        { error: "Terlalu banyak percobaan. Silakan coba lagi dalam 1 jam" },
        { status: 429 }
      );
    }

    // Get Supabase client
    console.log("🔌 Getting Supabase client...");
    const supabase = await createClient();
    console.log("✅ Supabase client connected");

    // Check if phone exists in customers table
    let customerExists = false;
    let customerData = null;

    console.log("🔍 STARTING DATABASE SEARCH");

    // SEARCH 1: customer_id exact match
    console.log(`📋 Search 1: Looking for customer_id = "${cleanedPhone}"`);
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("customer_id", cleanedPhone)
        .single();

      console.log("📊 Search 1 Results:", { data, error });

      if (data) {
        customerExists = true;
        customerData = data;
        console.log("✅ Customer found via customer_id!");
      } else {
        console.log("❌ Customer not found via customer_id");
      }
    } catch (error) {
      console.error("❌ Error in Search 1 (customer_id):", error);
    }

    // SEARCH 2: Alternative search if first failed
    if (!customerExists) {
      console.log("🔄 Trying alternative search methods...");

      // First, let's see what fields exist in the customers table
      try {
        const { data: sampleCustomers, error: sampleError } = await supabase
          .from("customers")
          .select("*")
          .limit(3);

        console.log("📋 Sample customers data:", sampleCustomers);
        console.log("📋 Sample customers error:", sampleError);

        if (sampleCustomers && sampleCustomers.length > 0) {
          console.log("🏗️ Customer table structure:", Object.keys(sampleCustomers[0]));
        }
      } catch (error) {
        console.error("❌ Error getting sample customers:", error);
      }

      // Try whatsapp field search
      console.log(`📋 Search 2: Looking for whatsapp = "${cleanedPhone}"`);
      try {
        const { data: whatsappData, error: whatsappError } = await supabase
          .from("customers")
          .select("*")
          .eq("whatsapp", cleanedPhone)
          .single();

        console.log("📊 Search 2 Results (whatsapp):", { whatsappData, whatsappError });

        if (whatsappData) {
          customerExists = true;
          customerData = whatsappData;
          console.log("✅ Customer found via whatsapp field!");
        }
      } catch (error) {
        console.error("❌ Error in Search 2 (whatsapp):", error);
      }

      // Try phone field search
      if (!customerExists) {
        console.log(`📋 Search 3: Looking for phone = "${cleanedPhone}"`);
        try {
          const { data: phoneData, error: phoneError } = await supabase
            .from("customers")
            .select("*")
            .eq("phone", cleanedPhone)
            .single();

          console.log("📊 Search 3 Results (phone):", { phoneData, phoneError });

          if (phoneData) {
            customerExists = true;
            customerData = phoneData;
            console.log("✅ Customer found via phone field!");
          }
        } catch (error) {
          console.error("❌ Error in Search 3 (phone):", error);
        }
      }

      // Try OR search
      if (!customerExists) {
        console.log(`📋 Search 4: OR search for any field = "${cleanedPhone}"`);
        try {
          const { data: orData, error: orError } = await supabase
            .from("customers")
            .select("*")
            .or(`whatsapp.eq.${cleanedPhone},phone.eq.${cleanedPhone},customer_id.eq.${cleanedPhone}`)
            .limit(5);

          console.log("📊 Search 4 Results (OR):", { orData, orError });

          if (orData && orData.length > 0) {
            customerExists = true;
            customerData = orData[0];
            console.log("✅ Customer found via OR search!");
          }
        } catch (error) {
          console.error("❌ Error in Search 4 (OR):", error);
        }
      }

      // Try LIKE search (partial match)
      if (!customerExists) {
        console.log(`📋 Search 5: LIKE search for partial match = "${cleanedPhone}"`);
        try {
          const { data: likeData, error: likeError } = await supabase
            .from("customers")
            .select("*")
            .or(`whatsapp.ilike.%${cleanedPhone}%,phone.ilike.%${cleanedPhone}%,customer_id.ilike.%${cleanedPhone}%`)
            .limit(5);

          console.log("📊 Search 5 Results (LIKE):", { likeData, likeError });

          if (likeData && likeData.length > 0) {
            customerExists = true;
            customerData = likeData[0];
            console.log("✅ Customer found via LIKE search!");
          }
        } catch (error) {
          console.error("❌ Error in Search 5 (LIKE):", error);
        }
      }
    }

    console.log("🎯 FINAL SEARCH RESULTS:", {
      customerExists,
      customerData,
      searchedPhone: cleanedPhone
    });

    if (!customerExists) {
      console.log("❌ NO CUSTOMER FOUND AFTER ALL SEARCH METHODS");
      return NextResponse.json(
        { error: `Nomor telepon tidak ditemukan dalam sistem kami. Searched for: "${cleanedPhone}"` },
        { status: 404 }
      );
    }

    // Generate secure hash with timestamp
    console.log("🔐 Generating secure hash...");
    const { hash, expiresAt } = generateSecureHash(cleanedPhone);
    console.log("✅ Hash generated:", { hash, expiresAt: expiresAt.toISOString() });

    // Store hash mapping in database for persistence
    console.log("💾 Storing dashboard session...");
    try {
      // Create longer session expiry for dashboard access (24 hours)
      const dashboardSessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const sessionData = {
        hash,
        phone: cleanedPhone,
        expires_at: expiresAt.toISOString(), // Link expiry (1 hour)
        dashboard_session_expires: dashboardSessionExpiry.toISOString(), // Dashboard session expiry (24 hours)
        ip_address: ip,
        user_agent: request.headers.get('user-agent') || 'unknown',
        created_at: new Date().toISOString()
      };

      console.log("📝 Session data to insert:", sessionData);

      const { data: insertData, error: insertError } = await supabase
        .from("dashboard_sessions")
        .insert(sessionData)
        .select();

      console.log("📊 Session insert results:", { insertData, insertError });

      if (insertError) {
        console.error("❌ Error storing dashboard session:", insertError);
        return NextResponse.json(
          { error: `Terjadi kesalahan saat membuat sesi: ${insertError.message}` },
          { status: 500 }
        );
      }

      console.log("✅ Session stored successfully");
      console.log(`📅 Link expires: ${expiresAt.toISOString()}`);
      console.log(`📅 Dashboard session expires: ${dashboardSessionExpiry.toISOString()}`);
    } catch (error) {
      console.error("❌ Unexpected error storing dashboard session:", error);
      return NextResponse.json(
        { error: `Terjadi kesalahan tak terduga: ${error instanceof Error ? error.message : String(error)}` },
        { status: 500 }
      );
    }

    // Log successful verification
    console.log("📝 Logging successful verification...");
    try {
      const logData = {
        phone: cleanedPhone,
        ip_address: ip,
        user_agent: request.headers.get('user-agent') || 'unknown',
        action: 'phone_verified',
        success: true,
        created_at: new Date().toISOString()
      };

      console.log("📊 Log data to insert:", logData);

      const { data: logInsertData, error: logInsertError } = await supabase
        .from("dashboard_access_logs")
        .insert(logData)
        .select();

      console.log("📊 Log insert results:", { logInsertData, logInsertError });

      if (logInsertError) {
        console.error("❌ Error logging access:", logInsertError);
        // Don't fail the operation if logging fails
      } else {
        console.log("✅ Access logged successfully");
      }
    } catch (error) {
      console.error("❌ Unexpected error logging access:", error);
      // Don't fail the operation if logging fails
    }

    const responseData = {
      success: true,
      redirectTo: `/customer-dashboard/${hash}`
    } as PhoneValidationResult;

    console.log("🎉 SUCCESS! Returning response:", responseData);

    return NextResponse.json(responseData);

  } catch (error) {
    console.error("Error in phone validation API:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server. Silakan coba lagi" },
      { status: 500 }
    );
  }
}

// Clean up expired sessions (this would typically be run as a cron job)
export async function GET() {
  try {
    const supabase = await createClient();

    // Delete expired sessions
    const { error } = await supabase
      .from("dashboard_sessions")
      .delete()
      .lt("expires_at", new Date().toISOString());

    if (error) {
      console.error("Error cleaning up expired sessions:", error);
      return NextResponse.json(
        { error: "Error cleaning up sessions" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Expired sessions cleaned up"
    });

  } catch (error) {
    console.error("Error in cleanup API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}