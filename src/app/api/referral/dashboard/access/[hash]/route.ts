import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

interface CustomerData {
  customer_id: string;
  name?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  created_at?: string;
  [key: string]: unknown;
}

interface PointsData {
  current_balance: number;
  total_earned: number;
  total_redeemed: number;
  last_updated?: string;
  [key: string]: unknown;
}

interface TransactionHistory {
  id: string;
  customer_id: string;
  transaction_type: string;
  points: number;
  description?: string;
  created_at: string;
  [key: string]: unknown;
}

interface OrderHistory {
  id: string;
  customer_id: string;
  status: string;
  total_amount: number;
  created_at: string;
  order_items?: {
    id: string;
    product_name: string;
    quantity: number;
    price: number;
    total_price: number;
  }[];
  [key: string]: unknown;
}

interface DashboardAccessResult {
  success: boolean;
  customerData?: CustomerData;
  pointsData?: PointsData;
  referralCode?: string;
  referralStats?: {
    totalReferrals: number;
    totalPointsEarned: number;
  };
  transactionHistory?: TransactionHistory[];
  orderHistory?: OrderHistory[];
  error?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  try {
    const { hash } = await params;
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    if (!hash) {
      return NextResponse.json(
        { error: "Hash tidak valid" },
        { status: 400 }
      );
    }

    // Get Supabase client
    const supabase = await createClient();

    // Check if hash exists and is valid
    let sessionData = null;
    try {
      const { data, error } = await supabase
        .from("dashboard_sessions")
        .select("*")
        .eq("hash", hash)
        .or(`and(expires_at.gt.${new Date().toISOString()},dashboard_session_expires.gt.${new Date().toISOString()})`)
        .single();

      console.log("🔍 Dashboard session lookup:", { hash, data, error });

      if (error || !data) {
        // Log failed access attempt
        await supabase
          .from("dashboard_access_logs")
          .insert({
            hash,
            ip_address: ip,
            user_agent: request.headers.get('user-agent') || 'unknown',
            action: 'dashboard_access_failed',
            success: false,
            error_reason: error?.message || 'invalid_or_expired_hash',
            created_at: new Date().toISOString()
        });

        // Provide more specific error messages
        let errorMessage = "Link tidak valid atau telah kedaluwarsa. Silakan masukkan nomor telepon lagi";

        if (error?.message?.includes('dashboard_session_expires')) {
          errorMessage = "Sesi dashboard telah kedaluwarsa. Silakan verifikasi nomor telepon lagi";
        }

        return NextResponse.json(
          { error: errorMessage },
          { status: 401 }
        );
      }

      // Check if link has expired but dashboard session is still valid
      const linkExpired = new Date(data.expires_at) < new Date();
      const dashboardSessionValid = data.dashboard_session_expires && new Date(data.dashboard_session_expires) > new Date();

      console.log("📅 Session timing check:", {
        linkExpired,
        dashboardSessionValid,
        expires_at: data.expires_at,
        dashboard_session_expires: data.dashboard_session_expires,
        now: new Date().toISOString()
      });

      if (linkExpired && !dashboardSessionValid) {
        await supabase
          .from("dashboard_access_logs")
          .insert({
            hash,
            ip_address: ip,
            user_agent: request.headers.get('user-agent') || 'unknown',
            action: 'dashboard_access_failed',
            success: false,
            error_reason: 'both_link_and_session_expired',
            created_at: new Date().toISOString()
        });

        return NextResponse.json(
          { error: "Link dan sesi telah kedaluwarsa. Silakan verifikasi nomor telepon lagi" },
          { status: 401 }
        );
      }

      sessionData = data;
    } catch (error) {
      console.error("Error checking dashboard session:", error);
      return NextResponse.json(
        { error: "Terjadi kesalahan saat memverifikasi akses" },
        { status: 500 }
      );
    }

    const phone = sessionData.phone;

    // Normalize phone number by removing special characters that cause URL encoding issues
    const normalizePhone = (phone: string) => {
      // Remove +62 and convert to 62 format to avoid URL encoding issues
      return phone.replace(/^\+62/, '62').replace(/[^0-9]/g, '');
    };

    const normalizedPhone = normalizePhone(phone);

    // Update session access information (don't mark as used immediately)
    try {
      const linkExpired = new Date(sessionData.expires_at) < new Date();

      await supabase
        .from("dashboard_sessions")
        .update({
          accessed_at: new Date().toISOString(),
          access_count: (sessionData.access_count || 0) + 1,
          // Only mark as used if link has expired but dashboard session is still valid
          used: linkExpired
        })
        .eq("hash", hash);

    } catch (error) {
      console.error("Error updating session access:", error);
      // Don't fail the operation if this fails
    }

    // Get customer data
    let customerData = null;
    let customerId = null;

    try {
      // Try to find customer by original phone as customer_id
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("customer_id", phone)
        .single();

      if (data) {
        customerData = data;
        customerId = data.customer_id;
      } else {
        // Try with normalized phone as customer_id
        const { data: normData } = await supabase
          .from("customers")
          .select("*")
          .eq("customer_id", normalizedPhone)
          .single();

        if (normData) {
          customerData = normData;
          customerId = normData.customer_id;
        } else {
          // If not found by customer_id, try to find by phone/whatsapp fields
          const phoneFormats = [phone, normalizedPhone];

          for (const phoneFormat of phoneFormats) {
            // First try phone field
            const { data: phoneData } = await supabase
              .from("customers")
              .select("*")
              .eq("phone", phoneFormat)
              .maybeSingle();

            if (phoneData) {
              customerData = phoneData;
              customerId = phoneData.customer_id;
              break;
            }

            // Then try whatsapp field
            const { data: whatsappData } = await supabase
              .from("customers")
              .select("*")
              .eq("whatsapp", phoneFormat)
              .maybeSingle();

            if (whatsappData) {
              customerData = whatsappData;
              customerId = whatsappData.customer_id;
              break;
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching customer data:", error);
    }

    // Get customer points data
    let pointsData = null;
    if (customerId) {
      try {
        const { data, error } = await supabase
          .from("customer_points")
          .select("*")
          .eq("customer_id", customerId)
          .single();

        if (data) {
          pointsData = data;
        }
      } catch (error) {
        console.error("Error fetching points data:", error);
      }
    }

    // Generate referral code (using Customer ID instead of phone)
    const referralCode = customerId || phone;

    // Get transaction history
    let transactionHistory = [];
    if (customerId) {
      try {
        const { data, error } = await supabase
          .from("points_transactions")
          .select("*")
          .eq("customer_id", customerId)
          .order("created_at", { ascending: false })
          .limit(20);

        if (data) {
          transactionHistory = data;
          console.log("✅ Found transaction history for customer:", customerId, data.length, "transactions");
        } else {
          console.log("ℹ️ No transaction history found for customer:", customerId);
        }
      } catch (error) {
        console.error("Error fetching transaction history:", error);
      }
    }

    // Get referral usage data (how many people this customer has referred)
    let referralStats = null;
    if (customerId) {
      try {
        const { data, error } = await supabase
          .from("referral_usage")
          .select("*")
          .eq("referrer_customer_id", customerId);

        if (data) {
          referralStats = {
            totalReferrals: data.length,
            totalPointsEarned: data.reduce((sum, usage) => sum + (usage.points_awarded || 0), 0)
          };
          console.log("✅ Found referral stats for customer:", customerId, referralStats);
        } else {
          console.log("ℹ️ No referral usage found for customer:", customerId);
        }
      } catch (error) {
        console.error("Error fetching referral stats:", error);
      }
    }

    // Get order history
    let orderHistory = [];
    if (customerId) {
      try {
        // First try the simple query that works in debug page
        const { data: simpleData, error: simpleError } = await supabase
          .from("orders")
          .select("*")
          .eq("customer_id", customerId)
          .limit(5);

        if (simpleData && simpleData.length > 0) {
          orderHistory = simpleData;
        } else {
          // Try the full query with order_items
          const { data, error } = await supabase
            .from("orders")
            .select(`
              *,
              order_items (
                id,
                product_name,
                quantity,
                price,
                total_price
              )
            `)
            .eq("customer_id", customerId)
            .order("created_at", { ascending: false })
            .limit(10);

          if (data && data.length > 0) {
            orderHistory = data;
          }
        }
      } catch (error) {
        console.error("Error fetching order history:", error);
      }
    }

    // Log successful access
    try {
      await supabase
        .from("dashboard_access_logs")
        .insert({
          phone,
          hash,
          ip_address: ip,
          user_agent: request.headers.get('user-agent') || 'unknown',
          action: 'dashboard_access_success',
          success: true,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error("Error logging access:", error);
      // Don't fail the operation if logging fails
    }

    return NextResponse.json({
      success: true,
      customerData: {
        ...customerData,
        phone: phone,
        customerId: customerId
      },
      pointsData: pointsData || {
        current_balance: 0,
        total_earned: 0,
        total_redeemed: 0
      },
      referralCode,
      referralStats: referralStats || {
        totalReferrals: 0,
        totalPointsEarned: 0
      },
      transactionHistory,
      orderHistory
    } as DashboardAccessResult);

  } catch (error) {
    console.error("Error in dashboard access API:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}