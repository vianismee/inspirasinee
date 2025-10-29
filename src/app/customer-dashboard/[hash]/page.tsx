"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ReferralDashboard } from "@/components/Referral/ReferralDashboard";
import { toast } from "sonner";
import { extractPhoneFromHash } from "@/lib/customer-dashboard-hash";
import { PointsService } from "@/lib/client-services";
import { createClient } from "@/utils/supabase/client";
import { logger } from "@/utils/client/logger";

interface DashboardData {
  success: boolean;
  customerData: {
    customer_id: string;
    name?: string;
    phone?: string;
    whatsapp?: string;
    email?: string;
  };
  pointsData: {
    current_balance: number;
    total_earned: number;
    total_redeemed: number;
  };
  referralCode: string;
  referralStats: {
    totalReferrals: number;
    totalPointsEarned: number;
  };
  transactionHistory: Array<{
    transaction_type: string;
    points_change: number;
    balance_after: number;
    reference_type: string;
    reference_id: string;
    description: string;
    created_at: string;
  }>;
  orderHistory: Array<{
    id: string;
    invoice_id: string;
    customer_id: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    total_amount: number;
    status: string;
    created_at: string;
    updated_at: string;
    order_items?: Array<{
      id: string;
      product_name: string;
      quantity: number;
      price: number;
      total_amount: number;
    }>;
  }>;
}

export default function CustomerDashboardHashPage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const hash = params.hash as string;

      if (!hash) {
        setError("Link tidak valid");
        setIsLoading(false);
        return;
      }

      try {
        // Extract phone number from hash without database dependency
        const { phone, valid } = extractPhoneFromHash(hash);

        if (!valid || !phone) {
          setError("Nomor telepon tidak terdaftar atau pengguna tidak valid");
          setIsLoading(false);
          return;
        }

        logger.debug("Phone extracted from hash", { hash, phone }, "CustomerDashboard");

        // Find customer by phone using client-side query
        const supabase = createClient();
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('customer_id, username, email, whatsapp, alamat')
          .eq('whatsapp', phone)
          .single();

        if (customerError || !customerData) {
          logger.error("Customer not found", { error: customerError, phone }, "CustomerDashboard");
          setError("Pelanggan tidak ditemukan untuk nomor telepon ini");
          setIsLoading(false);
          return;
        }

        logger.debug("Customer found", { customerData }, "CustomerDashboard");
        logger.debug("Customer data fields", {
          customer_id: customerData.customer_id,
          username: customerData.username,
          email: customerData.email,
          whatsapp: customerData.whatsapp,
          alamat: customerData.alamat
        }, "CustomerDashboard");

        // Fetch customer points (handle case where customer might not have points record yet)
        let pointsData = {
          current_balance: 0,
          total_earned: 0,
          total_redeemed: 0
        };

        try {
          const fetchedPoints = await PointsService.getCustomerBalance(customerData.customer_id);
          if (fetchedPoints) {
            pointsData = fetchedPoints;
          } else {
            logger.info("Customer has no points record yet, using defaults", { customerId: customerData.customer_id }, "CustomerDashboard");
          }
        } catch (pointsError) {
          logger.error("Error fetching customer points", { error: pointsError, customerId: customerData.customer_id }, "CustomerDashboard");
          // Continue with default points values
        }

        // Fetch points transaction history
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('points_transactions')
          .select('*')
          .eq('customer_id', customerData.customer_id)
          .order('created_at', { ascending: false })
          .limit(10); // Get last 10 transactions

        if (transactionsError) {
          logger.error("Error fetching transactions", { error: transactionsError, customerId: customerData.customer_id }, "CustomerDashboard");
        }

        // Fetch customer orders with order items (simplified query to avoid syntax issues)
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('customer_id', customerData.customer_id)
          .order('created_at', { ascending: false });

        if (ordersError) {
          logger.error("Error fetching orders", { error: ordersError, customerId: customerData.customer_id }, "CustomerDashboard");
        }

        // Build customer name with proper fallback
        const customerName = customerData.username ||
                           customerData.email ||
                           customerData.whatsapp ||
                           `Customer ${customerData.customer_id}`;

        logger.debug("Customer name calculation", {
          username: customerData.username,
          email: customerData.email,
          whatsapp: customerData.whatsapp,
          finalName: customerName
        }, "CustomerDashboard");

        // Build dashboard data
        const dashboardData: DashboardData = {
          success: true,
          customerData: {
            customer_id: customerData.customer_id,
            name: customerName,
            phone: customerData.whatsapp,
            whatsapp: customerData.whatsapp,
            email: customerData.email || ''
          },
          pointsData: pointsData,
          referralCode: customerData.customer_id || '',
          referralStats: {
            totalReferrals: 0, // TODO: Implement referral stats calculation
            totalPointsEarned: pointsData.total_earned || 0
          },
          transactionHistory: transactionsData || [],
          orderHistory: ordersData || []
        };

        setDashboardData(dashboardData);
      } catch (error) {
        logger.error("Error fetching dashboard data", { error, hash }, "CustomerDashboard");
        setError("Terjadi kesalahan saat memuat dashboard");
        toast.error("Terjadi kesalahan. Silakan coba lagi");

        setTimeout(() => {
          router.push("/customer-dashboard");
        }, 3000);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [params.hash, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-white relative flex items-center justify-center">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(229,231,235,0.8) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(229,231,235,0.8) 1px, transparent 1px),
              radial-gradient(circle 500px at 20% 80%, rgba(139,92,246,0.3), transparent),
              radial-gradient(circle 500px at 80% 20%, rgba(59,130,246,0.3), transparent)
            `,
            backgroundSize: "48px 48px, 48px 48px, 100% 100%, 100% 100%",
          }}
        />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-white relative flex items-center justify-center">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(229,231,235,0.8) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(229,231,235,0.8) 1px, transparent 1px),
              radial-gradient(circle 500px at 20% 80%, rgba(139,92,246,0.3), transparent),
              radial-gradient(circle 500px at 80% 20%, rgba(59,130,246,0.3), transparent)
            `,
            backgroundSize: "48px 48px, 48px 48px, 100% 100%, 100% 100%",
          }}
        />
        <div className="relative z-10 flex flex-col items-center gap-4 p-8 bg-white rounded-lg shadow-lg max-w-md mx-4">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800">Akses Gagal</h2>
          <p className="text-gray-600 text-center">{error}</p>
          <p className="text-sm text-gray-500 text-center">Mengarahkan kembali ke halaman verifikasi...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800">Loading...</h2>
        </div>
      </div>
    );
  }

  return <ReferralDashboard data={dashboardData} />;
}